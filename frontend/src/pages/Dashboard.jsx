import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetProjects, 
  apiCreateProject, 
  apiUpdateProject, 
  apiDeleteProject,
  apiGetAdminUsers
} from '../services/api';
import { Plus, Trash2, Edit3, ExternalLink, Calendar, X, AlertCircle, FolderGit2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // State variables for projects list
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State variables for admin-only user impersonation / project assignment
  const [users, setUsers] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('all');
  const [projectOwnerId, setProjectOwnerId] = useState('');

  // State variables for modals & inputs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null when creating, object when editing
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  // UI submit state tracker (anti-double-submission)
  const [submitInFlight, setSubmitInFlight] = useState(false);

  // Fetch all projects on mount
  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await apiGetAdminUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Could not retrieve system users list', err);
    }
  };

  /**
   * Action: Queries backend for user's projects.
   */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiGetProjects();
      setProjects(data.projects || []);
    } catch (err) {
      setError('Could not retrieve your projects. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Action: Opens the modal for creating a new project.
   */
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setProjectTitle('');
    setProjectDescription('');
    setProjectOwnerId(selectedOwnerId !== 'all' ? selectedOwnerId : user?.id || '');
    setIsModalOpen(true);
  };

  /**
   * Action: Opens the modal for editing an existing project.
   * @param {object} project
   */
  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description || '');
    setIsModalOpen(true);
  };

  /**
   * Action: Handles submission of Create or Edit form.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlight) return;
    setError('');

    // --- SECURITY REQUIREMENT: Client-side Sanitation & Validation ---
    const sanitizedTitle = projectTitle.trim();
    const sanitizedDesc = projectDescription.trim();

    if (!sanitizedTitle) {
      setError('Project title cannot be empty.');
      return;
    }

    try {
      setSubmitInFlight(true);
      if (editingProject) {
        // Update Action
        const data = await apiUpdateProject(editingProject.id, sanitizedTitle, sanitizedDesc);
        setProjects(prev => prev.map(p => p.id === editingProject.id ? data.project : p));
      } else {
        // Create Action
        const data = await apiCreateProject(sanitizedTitle, sanitizedDesc, user?.role === 'admin' ? projectOwnerId : undefined);
        setProjects(prev => [...prev, data.project]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitInFlight(false);
    }
  };

  /**
   * Action: Deletes a project.
   * @param {string} projectId
   */
  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project? All associated tasks will be orphaned.')) {
      return;
    }

    try {
      setError('');
      await apiDeleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  // Filter projects client-side if user specifies selection
  const filteredProjects = projects.filter(p => {
    if (selectedOwnerId === 'all') return true;
    return p.owner === Number(selectedOwnerId);
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-16 border-b border-borderLine pb-24 mb-32">
        <div className="text-left">
          <h1 className="text-32 font-bold tracking-tight text-textPrimary m-0">Projects</h1>
          <p className="text-textSecondary text-14 mt-4">Manage your active workspaces and monitor project pipelines.</p>
        </div>
        <div className="flex flex-wrap items-center gap-16 self-start md:self-auto">
          {user?.role === 'admin' && (
            <div className="flex items-center gap-12 bg-panel border border-borderLine rounded-8 px-16 py-10">
              <span className="text-14 text-textSecondary font-semibold">Acting as:</span>
              <select
                value={selectedOwnerId}
                onChange={(e) => {
                  setSelectedOwnerId(e.target.value);
                }}
                className="bg-transparent border-none text-textPrimary font-semibold text-14 cursor-pointer focus:outline-none"
              >
                <option value="all" className="bg-panel text-textPrimary">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-panel text-textPrimary">
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-18 h-18 text-white" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="mb-24 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium flex items-center gap-8 animate-pulse">
          <AlertCircle className="w-18 h-18 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid rendering list of projects */}
      {loading ? (
        // --- UX REQUIREMENT: Elegant skeleton card loaders (No simple text strings) ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-panel border border-borderLine rounded-12 p-24 h-180 flex flex-col justify-between animate-pulse">
              <div className="flex flex-col gap-12">
                <div className="h-20 bg-zinc-800 rounded w-2/3"></div>
                <div className="h-14 bg-zinc-800 rounded w-full"></div>
                <div className="h-14 bg-zinc-800 rounded w-4/5"></div>
              </div>
              <div className="h-14 bg-zinc-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        // --- UX REQUIREMENT: Clean, deliberate empty onboarding states ---
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-borderLine rounded-16 py-64 px-24 text-center my-32">
          {/* Custom TaskSpace Logo representation */}
          <div className="w-48 h-48 rounded-12 bg-zinc-900 border border-borderLine flex items-center justify-center text-textMuted mb-16 shrink-0 shadow-sm">
            <div className="flex gap-[3.5px]">
              <div className="flex flex-col gap-[3.5px]">
                <div className="w-[10px] h-[10px] bg-textMuted rounded-[2px]" />
                <div className="w-[10px] h-[10px] bg-textMuted rounded-[2px]" />
              </div>
              <div className="w-[10px] h-[23.5px] bg-textMuted rounded-[2px]" />
            </div>
          </div>
          <h3 className="text-18 font-bold text-textPrimary">
            {selectedOwnerId === 'all' ? 'No projects found' : 'No projects found for this user'}
          </h3>
          <p className="text-textSecondary text-14 max-w-400 mt-8 mb-24 leading-relaxed">
            {selectedOwnerId === 'all' 
              ? 'Create your first workspace to start grouping tasks and planning milestones.'
              : 'This user does not own any project workspaces yet.'}
          </p>
          {selectedOwnerId === 'all' && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-18 h-18 text-white" />
              <span>Create a Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {filteredProjects.map(project => (
            <div 
              key={project.id}
              className="bg-panel border border-borderLine hover:border-zinc-800 rounded-12 p-24 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Card content */}
              <div className="text-left flex flex-col gap-12">
                <div className="flex items-start justify-between gap-16">
                  <div className="flex flex-col gap-4 text-left">
                    <Link 
                      to={`/project/${project.id}`}
                      className="text-18 font-bold tracking-tight text-textPrimary group-hover:text-brand transition-colors line-clamp-1 leading-snug"
                    >
                      {project.title}
                    </Link>
                    {user?.role === 'admin' && project.ownerDetails && (
                      <span className="text-12 font-medium text-brand">
                        Owned by: {project.ownerDetails.name}
                      </span>
                    )}
                  </div>
                  {/* Outer Link */}
                  <Link 
                    to={`/project/${project.id}`}
                    className="text-textMuted hover:text-textPrimary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 hover:bg-zinc-800 rounded-4"
                    title="Open Board"
                  >
                    <ExternalLink className="w-16 h-16" />
                  </Link>
                </div>
                <p className="text-textSecondary text-14 line-clamp-2 leading-relaxed min-h-40">
                  {project.description || <span className="text-textMuted italic font-light">No description provided.</span>}
                </p>
              </div>

              {/* Card Footer */}
              <div className="border-t border-borderLine mt-20 pt-16 flex items-center justify-between">
                <div className="flex items-center gap-6 text-textMuted text-12">
                  <Calendar className="w-14 h-14" />
                  <span>{new Date(project.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => handleOpenEditModal(project)}
                    className="text-textMuted hover:text-textPrimary bg-zinc-900 border border-borderLine hover:border-zinc-700 p-8 rounded-6 transition-colors cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit3 className="w-14 h-14" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-textMuted hover:text-red-400 bg-zinc-900 border border-borderLine hover:border-red-950/30 p-8 rounded-6 transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-14 h-14" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog overlay for Create / Edit projects */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          {/* Blur backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-480 bg-panel border border-borderLine rounded-12 p-24 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-borderLine pb-16 mb-20">
              <h3 className="text-18 font-bold text-textPrimary">
                {editingProject ? 'Edit Project Workspace' : 'Create New Project'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-textMuted hover:text-textPrimary transition-colors p-4 rounded-4 cursor-pointer"
              >
                <X className="w-18 h-18" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-20">
              {/* Title input field */}
              <div className="flex flex-col gap-8 text-left">
                <label htmlFor="modalTitle" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                  Project Title
                </label>
                <input
                  id="modalTitle"
                  type="text"
                  required
                  maxLength={50}
                  disabled={submitInFlight}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                  placeholder="e.g. Q3 Roadmap Planning"
                />
              </div>

              {/* Description input field */}
              <div className="flex flex-col gap-8 text-left">
                <label htmlFor="modalDesc" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  id="modalDesc"
                  maxLength={1000}
                  disabled={submitInFlight}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full h-100 resize-none bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                  placeholder="Summarize the core target or scopes of this project..."
                />
              </div>

              {/* Assign Project Owner dropdown for admins (creation only) */}
              {user?.role === 'admin' && !editingProject && (
                <div className="flex flex-col gap-8 text-left">
                  <label htmlFor="modalOwner" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                    Assign Project Owner
                  </label>
                  <select
                    id="modalOwner"
                    disabled={submitInFlight}
                    value={projectOwnerId}
                    onChange={(e) => setProjectOwnerId(e.target.value)}
                    className="w-full bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary text-14 focus:outline-none focus:border-brand transition-colors disabled:opacity-50"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions Footer */}
              <div className="border-t border-borderLine pt-20 flex justify-end gap-12">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitInFlight}
                  className="px-16 py-10 bg-transparent hover:bg-zinc-900/60 border border-borderLine text-textSecondary hover:text-textPrimary rounded-8 text-14 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitInFlight}
                  className="px-16 py-10 bg-brand hover:bg-brand-dark disabled:bg-brand/50 text-white rounded-8 text-14 font-semibold transition-colors flex items-center gap-8 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitInFlight ? (
                    <>
                      <div className="w-14 h-14 border-t-2 border-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
