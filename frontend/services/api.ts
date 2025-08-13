import { MenuItem, AdminOrder, AdminStats, CartItem } from '../types';

// The base URL of our new backend server
const API_BASE_URL = 'http://localhost:3001/api';

// --- PUBLIC API METHODS ---

// Helper function to handle fetch responses
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorInfo = await response.json();
    throw new Error(errorInfo.message || 'An unknown error occurred');
  }
  return response.json();
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  return fetchApi('/menu-items');
};

export const getTestimonials = async (): Promise<any[]> => {
  return fetchApi('/testimonials');
};

export const getOrders = async (): Promise<AdminOrder[]> => {
  return fetchApi('/orders');
};

export const getStats = async (): Promise<AdminStats> => {
  return fetchApi('/stats');
};

export const placeOrder = async (cartItems: CartItem[], details: { name: string, tip: number }): Promise<AdminOrder> => {
  return fetchApi('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cartItems, details }),
  });
};

export const uploadMenuContent = async (pdfFile: File | null, imageFiles: File[]): Promise<{ message: string }> => {
    // File uploads are more complex and typically use FormData.
    // This is a simplified version that matches the mock backend endpoint.
    // In a real-world scenario, you'd use a library like 'axios' and 'form-data' to handle this.
    const formData = new FormData();
    if (pdfFile) {
        formData.append('pdfFile', pdfFile);
    }
    imageFiles.forEach(file => {
        formData.append('imageFiles', file);
    });

    // Since the backend is mocking the response, we don't need to send the actual form data yet.
    const response = await fetch(`${API_BASE_URL}/upload-menu`, {
        method: 'POST',
        // body: formData, // This would be used with a real file-handling backend
    });

    if (!response.ok) {
        const errorInfo = await response.json();
        throw new Error(errorInfo.message || 'File upload failed');
    }

    return response.json();
};
