/**
 * File: src/pages/Dashboard.jsx
 * Overall Purpose: Project dashboard view listing all current workspaces owned by the user.
 * Connections: Queries apiGetProjects, apiCreateProject, apiUpdateProject, and apiDeleteProject.
 * Bridges navigation to individual Kanban boards (/project/:id).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetProjects, 
  apiCreateProject, 
  apiUpdateProject, 
  apiDeleteProject 
} from '../services/api';
import { Plus, Trash2, Edit3, ExternalLink, Calendar, X, AlertCircle, FolderGit2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // State variables for projects list
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

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
        const data = await apiUpdateProject(editingProject._id, sanitizedTitle, sanitizedDesc);
        setProjects(prev => prev.map(p => p._id === editingProject._id ? data.project : p));
      } else {
        // Create Action
        const data = await apiCreateProject(sanitizedTitle, sanitizedDesc);
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
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-16 border-b border-borderLine pb-24 mb-32">
        <div className="text-left">
          <h1 className="text-32 font-bold tracking-tight text-textPrimary m-0">Projects</h1>
          <p className="text-textSecondary text-14 mt-4">Manage your active workspaces and monitor project pipelines.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-18 h-18" />
          <span>New Project</span>
        </button>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="mb-24 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium flex items-center gap-8">
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
      ) : projects.length === 0 ? (
        // --- UX REQUIREMENT: Clean, deliberate empty onboarding states ---
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-borderLine rounded-16 py-64 px-24 text-center my-32">
          <div className="w-64 h-64 rounded-full bg-zinc-900 border border-borderLine flex items-center justify-center text-textMuted mb-16">
            <FolderGit2 className="w-32 h-32" />
          </div>
          <h3 className="text-18 font-bold text-textPrimary">No projects found</h3>
          <p className="text-textSecondary text-14 max-w-400 mt-8 mb-24">
            Create your first workspace to start grouping tasks and planning milestones.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-18 h-18" />
            <span>Create a Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {projects.map(project => (
            <div 
              key={project._id}
              className="bg-panel border border-borderLine hover:border-zinc-700 rounded-12 p-24 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Card content */}
              <div className="text-left flex flex-col gap-12">
                <div className="flex items-start justify-between gap-16">
                  <h3 className="text-18 font-bold tracking-tight text-textPrimary group-hover:text-brand transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  {/* Outer Link */}
                  <Link 
                    to={`/project/${project._id}`}
                    className="text-textMuted hover:text-textPrimary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
                <div className="flex items-center gap-12">
                  <button
                    onClick={() => handleOpenEditModal(project)}
                    className="text-textMuted hover:text-textPrimary transition-colors p-4 hover:bg-zinc-800 rounded-4 cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit3 className="w-14 h-14" />
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="text-textMuted hover:text-red-400 transition-colors p-4 hover:bg-zinc-800 rounded-4 cursor-pointer"
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
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
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
                className="text-textMuted hover:text-textPrimary transition-colors p-4 rounded-4"
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
                  maxLength={200}
                  disabled={submitInFlight}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full h-100 resize-none bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                  placeholder="Summarize the core target or scopes of this project..."
                />
              </div>

              {/* Actions Footer */}
              <div className="border-t border-borderLine pt-20 flex justify-end gap-12">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitInFlight}
                  className="px-16 py-10 bg-zinc-800 hover:bg-zinc-700 text-textSecondary hover:text-textPrimary rounded-8 text-14 font-semibold transition-colors cursor-pointer disabled:opacity-50"
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
