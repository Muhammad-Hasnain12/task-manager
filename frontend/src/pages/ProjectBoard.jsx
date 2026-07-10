/**
 * File: src/pages/ProjectBoard.jsx
 * Overall Purpose: Project kanban board view grouping tasks into column pipelines.
 * Connections: Integrates with apiGetProjects (to resolve project details), apiGetTasks,
 * apiCreateTask, apiUpdateTaskStatus, and apiDeleteTask.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  apiGetProjects, 
  apiGetTasks, 
  apiCreateTask, 
  apiUpdateTaskStatus, 
  apiDeleteTask 
} from '../services/api';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  ListTodo 
} from 'lucide-react';

const ProjectBoard = () => {
  const { projectId } = useParams();

  // Project context state variables
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & form input state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  
  // UX submission locks
  const [submitInFlight, setSubmitInFlight] = useState(false);

  // Load project details and tasks on mount or route change
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch all projects and extract this board's matching metadata
        const projectsData = await apiGetProjects();
        const currentProject = projectsData.projects.find(p => p._id === projectId);
        
        if (!currentProject) {
          setError('The requested project does not exist or access was denied.');
          setLoading(false);
          return;
        }
        
        setProject(currentProject);

        // Fetch task list
        const tasksData = await apiGetTasks(projectId);
        setTasks(tasksData.tasks || []);
      } catch (err) {
        setError('Failed to load board tasks. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    loadBoardData();
  }, [projectId]);

  /**
   * Action: Opens the Create Task modal, optionally pre-selecting a column.
   * @param {string} columnStatus - 'todo' | 'in-progress' | 'done'
   */
  const handleOpenCreateModal = (columnStatus = 'todo') => {
    setTaskTitle('');
    setTaskStatus(columnStatus);
    setTaskDueDate('');
    setIsModalOpen(true);
  };

  /**
   * Action: Handles submission of the Task Creation form.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlight) return;
    setError('');

    // --- SECURITY REQUIREMENT: Client-side Sanitation & Validation ---
    const sanitizedTitle = taskTitle.trim();
    if (!sanitizedTitle) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      setSubmitInFlight(true);
      const data = await apiCreateTask(sanitizedTitle, taskStatus, taskDueDate || null, projectId);
      setTasks(prev => [...prev, data.task]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSubmitInFlight(false);
    }
  };

  /**
   * Action: Modifies the status column of a task.
   * @param {string} taskId
   * @param {string} newStatus - 'todo' | 'in-progress' | 'done'
   */
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setError('');
      const data = await apiUpdateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
    } catch (err) {
      setError('Could not update task status.');
    }
  };

  /**
   * Action: Deletes a task from the project.
   * @param {string} taskId
   */
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setError('');
      await apiDeleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      setError('Delete operation failed.');
    }
  };

  // Define Columns configuration with unique themes
  const columns = [
    { 
      id: 'todo', 
      title: 'To Do', 
      icon: <ListTodo className="w-16 h-16 text-blue-400" />,
      colorClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      icon: <Play className="w-16 h-16 text-amber-500" />,
      colorClass: 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
    },
    { 
      id: 'done', 
      title: 'Completed', 
      icon: <CheckCircle2 className="w-16 h-16 text-emerald-400" />,
      colorClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Return Navigation */}
      <Link 
        to="/dashboard" 
        className="flex items-center gap-6 text-textSecondary hover:text-textPrimary text-14 font-medium transition-colors mb-16 self-start"
      >
        <ChevronLeft className="w-16 h-16" />
        <span>Back to Projects</span>
      </Link>

      {/* Header and Project details */}
      {project && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-16 border-b border-borderLine pb-24 mb-32">
          <div className="text-left">
            <h1 className="text-32 font-bold tracking-tight text-textPrimary m-0">{project.title}</h1>
            {project.description && (
              <p className="text-textSecondary text-14 mt-4 leading-relaxed">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => handleOpenCreateModal('todo')}
            className="flex items-center justify-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-18 h-18" />
            <span>Create Task</span>
          </button>
        </div>
      )}

      {/* Global error banner */}
      {error && (
        <div className="mb-24 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium flex items-center gap-8">
          <AlertCircle className="w-18 h-18 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Board Pipeline columns grid */}
      {loading ? (
        // --- UX REQUIREMENT: Skeleton column loader ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 flex-1">
          {columns.map(col => (
            <div key={col.id} className="bg-panel border border-borderLine rounded-12 p-16 h-500 animate-pulse flex flex-col gap-16">
              <div className="h-20 bg-zinc-800 rounded w-1/3 mb-12"></div>
              <div className="h-100 bg-zinc-800/50 rounded-8"></div>
              <div className="h-100 bg-zinc-800/50 rounded-8"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 items-start flex-1">
          {columns.map(col => {
            const filteredTasks = tasks.filter(t => t.status === col.id);

            return (
              <div 
                key={col.id}
                className="bg-panel border border-borderLine rounded-12 p-16 flex flex-col min-h-400 lg:min-h-500"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-borderLine pb-12 mb-16">
                  <div className="flex items-center gap-8">
                    {col.icon}
                    <span className="font-bold text-textPrimary text-14 uppercase tracking-wider">{col.title}</span>
                  </div>
                  <span className="px-8 py-2 rounded-full bg-zinc-800 text-textSecondary text-12 font-semibold">
                    {filteredTasks.length}
                  </span>
                </div>

                {/* Task Cards Stack */}
                <div className="flex flex-col gap-12 flex-1">
                  {filteredTasks.length === 0 ? (
                    // Deliberate column empty layout
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-borderLine/50 rounded-8 p-24 text-center text-textMuted select-none">
                      <span className="text-12 font-medium">No tasks</span>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                      
                      return (
                        <div 
                          key={task._id}
                          className="bg-background border border-borderLine hover:border-zinc-700 p-16 rounded-8 shadow-sm transition-all text-left flex flex-col justify-between gap-16 group"
                        >
                          {/* Task details */}
                          <div className="flex flex-col gap-8">
                            <h4 className="text-14 font-semibold text-textPrimary leading-snug line-clamp-2">
                              {task.title}
                            </h4>
                            
                            {/* Due date badge */}
                            {task.dueDate && (
                              <div className={`inline-flex items-center gap-6 text-12 font-medium ${isOverdue ? 'text-red-400' : 'text-textMuted'}`}>
                                <Calendar className="w-12 h-12" />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Task Actions Footer */}
                          <div className="border-t border-borderLine/50 pt-12 flex items-center justify-between">
                            {/* Pipeline Status Selector */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className="bg-zinc-850 border border-borderLine text-textSecondary text-12 rounded-4 py-4 px-8 focus:outline-none focus:border-brand cursor-pointer"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="done">Completed</option>
                            </select>

                            {/* Delete Task */}
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-textMuted hover:text-red-400 transition-colors p-4 rounded-4 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Task"
                            >
                              <Trash2 className="w-14 h-14" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column footer action to quickly add task inside this pipeline */}
                <button
                  onClick={() => handleOpenCreateModal(col.id)}
                  className="mt-16 w-full py-8 border border-dashed border-borderLine hover:border-brand/40 text-textSecondary hover:text-brand flex items-center justify-center gap-6 rounded-8 text-12 font-semibold transition-all cursor-pointer bg-zinc-900/10 hover:bg-brand/5"
                >
                  <Plus className="w-14 h-14" />
                  <span>Add Card</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-440 bg-panel border border-borderLine rounded-12 p-24 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-borderLine pb-16 mb-20">
              <h3 className="text-18 font-bold text-textPrimary">Create Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-textMuted hover:text-textPrimary transition-colors p-4 rounded-4"
              >
                <X className="w-18 h-18" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-20">
              {/* Task Title */}
              <div className="flex flex-col gap-8 text-left">
                <label htmlFor="taskTitleInput" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  id="taskTitleInput"
                  type="text"
                  required
                  maxLength={100}
                  disabled={submitInFlight}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                  placeholder="e.g. Finalize presentation draft"
                />
              </div>

              {/* Task Status */}
              <div className="flex flex-col gap-8 text-left">
                <label htmlFor="taskStatusSelect" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                  Pipeline Stage
                </label>
                <select
                  id="taskStatusSelect"
                  disabled={submitInFlight}
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>

              {/* Task Due Date */}
              <div className="flex flex-col gap-8 text-left">
                <label htmlFor="taskDueDateInput" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  id="taskDueDateInput"
                  type="date"
                  disabled={submitInFlight}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-background border border-borderLine rounded-8 py-10 px-16 text-textPrimary text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50 cursor-pointer"
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
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Task</span>
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

export default ProjectBoard;
