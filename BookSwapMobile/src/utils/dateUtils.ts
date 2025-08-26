// Date and time utility functions
export const formatMessageTime = (dateString: string): string => {
  try {
    // Handle different date string formats and timezone issues
    let date: Date;
    
    // If the dateString doesn't end with 'Z' or timezone info, assume it's UTC
    if (dateString && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      // Assume server sends UTC timestamps, append 'Z' to indicate UTC
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid time';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    // Get local date components for comparison
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    // If message is from today, show time only
    if (messageDate.getTime() === todayDate.getTime()) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If message is from yesterday
    if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If message is from this week, show day and time
    if (diffInDays < 7 && diffInDays >= 0) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             date.toLocaleTimeString([], { 
               hour: '2-digit', 
               minute: '2-digit',
               hour12: true
             });
    }
    
    // For older messages, show date and time
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    }) + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting message time:', error, 'Input:', dateString);
    return 'Invalid time';
  }
};

export const formatMemberSince = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Unknown';
    }
    
    // Format date in a readable format
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting member since date:', error);
    return 'Unknown';
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    // Handle different date string formats and timezone issues (same as formatMessageTime)
    let date: Date;
    
    // If the dateString doesn't end with 'Z' or timezone info, assume it's UTC
    if (dateString && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      // Assume server sends UTC timestamps, append 'Z' to indicate UTC
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string in formatRelativeTime:', dateString);
      return 'Unknown';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return formatMessageTime(dateString);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error, 'Input:', dateString);
    return 'Unknown';
  }
};

export const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};
