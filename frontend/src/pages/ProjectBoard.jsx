import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
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
  ListTodo,
  MoreVertical 
} from 'lucide-react';

/**
 * DroppableColumnContainer
 * Wraps a Kanban column layout to register it as a droppable target via `@dnd-kit/core`.
 * Highlight and border styling updates dynamically when a draggable item is actively hovering.
 */
const DroppableColumnContainer = ({ col, filteredTasks, handleOpenCreateModal, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-panel border rounded-12 p-16 flex flex-col min-h-400 lg:min-h-500 transition-colors ${
        isOver ? 'border-brand ring-1 ring-brand/40 bg-zinc-900/50' : 'border-borderLine'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-borderLine pb-12 mb-16">
        <div className="flex items-center gap-8">
          {col.icon}
          <span className="font-bold text-textPrimary text-14 uppercase tracking-wider">{col.title}</span>
        </div>
        <span className="px-8 py-2 rounded-full bg-zinc-800 text-textSecondary text-12 font-semibold shadow-sm">
          {filteredTasks.length}
        </span>
      </div>

      {/* Task Cards Stack */}
      <div className="flex flex-col gap-12 flex-1">
        {children}
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
};

/**
 * DraggableTaskCard
 * Wraps a single Kanban task card to make it draggable via `@dnd-kit/core`.
 * Captures pointer actions on the card body while allowing interactive inputs (select dropdown, delete button)
 * to propagate clicks and selections natively.
 */
const DraggableTaskCard = ({ task, isOverdue, selectStyle, handleStatusChange, handleDeleteTask }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: {
      status: task.status,
      task: task
    }
  });

  // Apply visual offset during active drag
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-background border border-borderLine hover:border-zinc-700 p-16 rounded-8 shadow-sm text-left flex flex-col justify-between gap-16 group touch-none ${
        isDragging ? 'opacity-50 scale-[0.98] border-brand shadow-lg z-50 cursor-grabbing' : 'cursor-grab'
      } transition-transform duration-100`}
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
        {/* Pipeline Status Selector styled as colored status pills */}
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(task._id, e.target.value)}
          className={`text-12 rounded-6 py-4 px-12 focus:outline-none cursor-pointer font-medium transition-all ${selectStyle}`}
          // Avoid triggering drag/listeners when clicking dropdown selector
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="todo" className="bg-zinc-900 text-zinc-300">To Do</option>
          <option value="in-progress" className="bg-zinc-900 text-amber-400">In Progress</option>
          <option value="done" className="bg-zinc-900 text-emerald-400">Done</option>
        </select>

        {/* Delete Task */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTask(task._id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-textMuted hover:text-red-400 transition-colors p-4 hover:bg-zinc-800 rounded-4 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-14 h-14" />
        </button>
      </div>
    </div>
  );
};

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
   * Action: Modifies the status column of a task optimistically with rollback.
   * @param {string} taskId
   * @param {string} newStatus - 'todo' | 'in-progress' | 'done'
   */
  const handleStatusChange = async (taskId, newStatus) => {
    const taskToUpdate = tasks.find(t => t._id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    const oldStatus = taskToUpdate.status;

    // Save previous tasks state in case we need to rollback
    const previousTasks = [...tasks];

    // Optimistically update tasks state locally
    setTasks(prev =>
      prev.map(t => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    setError('');

    try {
      const data = await apiUpdateTaskStatus(taskId, newStatus);
      // Synchronize state with backend response
      setTasks(prev =>
        prev.map(t => (t._id === taskId ? data.task : t))
      );
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      setError('Could not update task status. Reverted to original stage.');
    }
  };

  /**
   * Action: Handles the drop event from @dnd-kit/core.
   * Maps drag source status to drop target status and triggers status update.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // If not dropped over a droppable target, do nothing
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id; // Target column ID ('todo' | 'in-progress' | 'done')
    const oldStatus = active.data.current.status;

    // If dropped in the same column, do nothing
    if (oldStatus === newStatus) return;

    // Trigger status update
    handleStatusChange(taskId, newStatus);
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
      icon: (
        <div className="w-28 h-28 rounded-6 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <ListTodo className="w-14 h-14" />
        </div>
      )
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      icon: (
        <div className="w-28 h-28 rounded-6 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <Play className="w-14 h-14 fill-current text-amber-500" />
        </div>
      )
    },
    { 
      id: 'done', 
      title: 'Completed', 
      icon: (
        <div className="w-28 h-28 rounded-6 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-14 h-14" />
        </div>
      )
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
          <div className="flex items-center gap-12 self-start md:self-auto">
            <button
              onClick={() => handleOpenCreateModal('todo')}
              className="flex items-center justify-center gap-8 px-16 py-10 bg-brand hover:bg-brand-dark text-white rounded-8 text-14 font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-18 h-18 text-white" />
              <span>Create Task</span>
            </button>
            <button 
              className="w-40 h-40 flex items-center justify-center border border-borderLine hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800 text-textSecondary hover:text-textPrimary rounded-8 transition-colors cursor-pointer"
              title="More Actions"
            >
              <MoreVertical className="w-18 h-18" />
            </button>
          </div>
        </div>
      )}

      {/* Global error banner */}
      {error && (
        <div className="mb-24 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium flex items-center gap-8 animate-pulse">
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
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 items-start flex-1">
            {columns.map(col => {
              const filteredTasks = tasks.filter(t => t.status === col.id);

              return (
                <DroppableColumnContainer
                  key={col.id}
                  col={col}
                  filteredTasks={filteredTasks}
                  handleOpenCreateModal={handleOpenCreateModal}
                >
                  {filteredTasks.length === 0 ? (
                    // Deliberate column empty layout
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-borderLine/50 rounded-8 p-24 text-center text-textMuted select-none">
                      <span className="text-12 font-medium">No tasks</span>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                      
                      // Colored styles for select dropdowns based on status
                      let selectStyle = 'bg-zinc-900 border border-borderLine text-zinc-300 hover:bg-zinc-850 hover:text-textPrimary';
                      if (task.status === 'in-progress') {
                        selectStyle = 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20';
                      } else if (task.status === 'done') {
                        selectStyle = 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
                      }

                      return (
                        <DraggableTaskCard
                          key={task._id}
                          task={task}
                          isOverdue={isOverdue}
                          selectStyle={selectStyle}
                          handleStatusChange={handleStatusChange}
                          handleDeleteTask={handleDeleteTask}
                        />
                      );
                    })
                  )}
                </DroppableColumnContainer>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Create Task Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-440 bg-panel border border-borderLine rounded-12 p-24 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-borderLine pb-16 mb-20">
              <h3 className="text-18 font-bold text-textPrimary">Create Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-textMuted hover:text-textPrimary transition-colors p-4 rounded-4 cursor-pointer"
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
                  placeholder="e.g. Implement dark mode"
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
                  <option value="todo" className="bg-zinc-950 text-textPrimary">To Do</option>
                  <option value="in-progress" className="bg-zinc-950 text-textPrimary">In Progress</option>
                  <option value="done" className="bg-zinc-950 text-textPrimary">Completed</option>
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
