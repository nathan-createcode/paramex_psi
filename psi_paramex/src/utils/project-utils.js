/* eslint-disable no-case-declarations */
// Tipe data dihapus, hanya pakai komentar dokumentasi

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string} client
 * @property {string} startDate
 * @property {string} deadline
 * @property {string} type
 * @property {string} payment
 * @property {'Low' | 'Medium' | 'High'} difficulty
 * @property {'On-Process' | 'On-Plan' | 'Done'} status
 */

/**
 * @typedef {Object} ProjectFilters
 * @property {string} status
 * @property {string} difficulty
 * @property {string} deadline
 */

/**
 * Filter projects based on search query and filters
 * @param {Project[]} projects
 * @param {string} searchQuery
 * @param {ProjectFilters} filters
 * @returns {Project[]}
 */
export const filterProjects = (projects, searchQuery, filters) => {
  return projects.filter((project) => {
    const matchesSearch =
      searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filters.status === 'all'
        ? true
        : filters.status === 'To Do'
        ? ['On-Plan', 'On-Process', 'Overdue'].includes(project.status)
        : project.status === filters.status;

    const matchesDifficulty =
      filters.difficulty === 'all' || project.difficulty === filters.difficulty;

    const matchesDeadline =
      filters.deadline === 'all' ||
      checkDeadlineFilter(project, filters.deadline);

    return (
      matchesSearch && matchesStatus && matchesDifficulty && matchesDeadline
    );
  });
};


/**
 * Check if a project's deadline matches the filter
 * @param {Project} project
 * @param {string} deadlineFilter
 * @returns {boolean}
 */
const checkDeadlineFilter = (project, deadlineFilter) => {
  const today = new Date();
  const deadline = new Date(project.deadline);

  switch (deadlineFilter) {
    case 'This Week':
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline >= today && deadline <= weekFromNow;

    case 'This Month':
      const monthFromNow = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      return deadline >= today && deadline <= monthFromNow;

    case 'Next Month':
      const nextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      const monthAfterNext = new Date(
        today.getFullYear(),
        today.getMonth() + 2,
        today.getDate()
      );
      return deadline >= nextMonth && deadline <= monthAfterNext;

    case 'Overdue':
      return deadline < today && project.status !== 'Done';

    default:
      return true;
  }
};

/**
 * Format a date string to readable format (e.g., "Jan 1, 2025")
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format currency amount with dollar sign and comma separators
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '$0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '$0';
  }
  
  // Ensure we don't format numbers that are too large
  const safeAmount = Math.min(Math.max(numAmount, 0), 2147483647);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

/**
 * Get deadline status and corresponding styles
 * @param {string} deadlineString
 * @param {string} projectStatus
 * @returns {Object} Object with status and styling class
 */
export const getDeadlineStatus = (deadlineString, projectStatus) => {
  const today = new Date();
  const deadline = new Date(deadlineString);
  const timeDiff = deadline.getTime() - today.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // If project is done, use normal styling
  if (projectStatus && projectStatus.toLowerCase() === 'done') {
    return {
      status: 'completed',
      className: 'text-gray-600'
    };
  }
  
  // Check if deadline has passed
  if (timeDiff < 0) {
    return {
      status: 'overdue',
      className: 'text-red-600 font-medium'
    };
  }
  
  // Check if deadline is within 24 hours
  if (hoursDiff <= 24) {
    return {
      status: 'urgent',
      className: 'text-yellow-600 font-medium'
    };
  }
  
  // Normal deadline
  return {
    status: 'normal',
    className: 'text-gray-600'
  };
};
