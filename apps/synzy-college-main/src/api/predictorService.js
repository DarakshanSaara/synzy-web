import apiClient from './axios';

// Posts user filters and returns matched colleges (public route)
export const predictcolleges = async (filters) => {
	// Use the correct backend route: /admin/predict-colleges
	const { data } = await apiClient.post('/admin/predict-colleges', filters);
	return data;
};


