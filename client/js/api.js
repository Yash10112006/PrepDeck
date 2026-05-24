const API_BASE_URL = 'http://localhost:5000/api';

class Api {
  constructor() {
    this.token = localStorage.getItem('prepdeck_token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    this.token = data.token;
    localStorage.setItem('prepdeck_token', data.token);
    localStorage.setItem('prepdeck_user', JSON.stringify(data));
    return data;
  }

  async register(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    this.token = data.token;
    localStorage.setItem('prepdeck_token', data.token);
    localStorage.setItem('prepdeck_user', JSON.stringify(data));
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('prepdeck_token');
    localStorage.removeItem('prepdeck_user');
    window.location.href = '/auth.html';
  }

  async getDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/study/stats`, { headers: this.getHeaders() });
    if (res.status === 401) this.logout();
    return res.json();
  }

  async getDocuments(type) {
    const url = type ? `${API_BASE_URL}/docs?type=${type}` : `${API_BASE_URL}/docs`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (res.status === 401) this.logout();
    return res.json();
  }

  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE_URL}/docs/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(), // FormData handles content-type
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  async saveStudySession(sessionData) {
    const res = await fetch(`${API_BASE_URL}/study/session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sessionData)
    });
    return res.json();
  }

  async generateQuestions(documentId) {
    const res = await fetch(`${API_BASE_URL}/study/generate-questions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ documentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  async evaluateSession(payload) {
    const res = await fetch(`${API_BASE_URL}/study/evaluate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }
  async generateQuiz(documentId, difficultyLevel) {
    const res = await fetch(`${API_BASE_URL}/study/generate-quiz`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ documentId, difficultyLevel })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  async evaluateQuiz(payload) {
    const res = await fetch(`${API_BASE_URL}/study/evaluate-quiz`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  async getQuizHistory(documentId) {
    const res = await fetch(`${API_BASE_URL}/study/quiz-history/${documentId}`, { headers: this.getHeaders() });
    if (res.status === 401) this.logout();
    return res.json();
  }
}

const api = new Api();
