const API_BASE_URL = 'http://localhost:5000/api';

class Api {
  constructor() {
    this.token = localStorage.getItem('prepdeck_token');
    this.syncPendingSession();
  }

  async syncPendingSession() {
    try {
      const pending = localStorage.getItem('prepdeck_pending_session');
      if (pending && this.token) {
        const sessionData = JSON.parse(pending);
        // Only sync if session lasted more than 2 seconds to filter out noise
        if (sessionData.durationMs > 2000) {
          sessionData.endTime = Date.now();
          await this.saveStudySession(sessionData);
        }
        localStorage.removeItem('prepdeck_pending_session');
      }
    } catch (e) {
      console.error("Failed to sync pending study session:", e);
      localStorage.removeItem('prepdeck_pending_session');
    }
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

  async getStudySessions() {
    const res = await fetch(`${API_BASE_URL}/study/sessions`, { headers: this.getHeaders() });
    if (res.status === 401) this.logout();
    return res.json();
  }

  async getAllQuizHistory() {
    const res = await fetch(`${API_BASE_URL}/study/quizzes`, { headers: this.getHeaders() });
    if (res.status === 401) this.logout();
    return res.json();
  }

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem('prepdeck_user', JSON.stringify(data));
    this.token = data.token;
    localStorage.setItem('prepdeck_token', data.token);
    return data;
  }
}

const api = new Api();

// Profile Modal Injection and Handlers
window.openProfileModal = async function() {
  let modal = document.getElementById('profile-modal');
  if (!modal) {
    // Create and inject modal HTML
    modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm hidden transition-opacity duration-300 opacity-0';
    modal.innerHTML = `
      <div class="bg-[#181a1f] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden transform scale-95 transition-all duration-300">
        <!-- Background Glow -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#08e3d6]/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-6 relative z-10">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-user-astronaut text-[#08e3d6]"></i> Edit Profile
          </h3>
          <button onclick="closeProfileModal()" class="text-slate-400 hover:text-white transition-colors">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <!-- Alert / Status -->
        <div id="profile-alert" class="hidden mb-4 p-3 rounded-xl text-xs font-semibold border"></div>

        <!-- Form -->
        <form id="profile-form" onsubmit="handleProfileSubmit(event)" class="space-y-4 relative z-10">
          <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
            <input type="text" id="profile-name" required class="w-full bg-[#0a0a0c] border border-white/5 text-slate-200 text-sm font-semibold rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#08e3d6] placeholder-slate-600">
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" id="profile-email" required class="w-full bg-[#0a0a0c] border border-white/5 text-slate-200 text-sm font-semibold rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#08e3d6] placeholder-slate-600">
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">New Password (leave blank to keep current)</label>
            <input type="password" id="profile-password" class="w-full bg-[#0a0a0c] border border-white/5 text-slate-200 text-sm font-semibold rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#08e3d6] placeholder-slate-600" placeholder="••••••••">
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Subscription Tier</label>
            <div class="w-full bg-[#141416] border border-white/5 text-[#08e3d6] text-xs font-extrabold tracking-wider rounded-xl py-3 px-4 flex items-center justify-between">
              <span>PRO TIER PLAN</span>
              <i class="fa-solid fa-circle-check text-[#08e3d6]"></i>
            </div>
          </div>
          <button type="submit" id="profile-save-btn" class="w-full py-3 rounded-xl bg-[#08e3d6] text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(8,227,214,0.3)] mt-2 flex justify-center items-center gap-2">
            Save Changes
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProfileModal();
    });
  }

  // Populate data
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const pwdInput = document.getElementById('profile-password');
  const alertDiv = document.getElementById('profile-alert');
  
  alertDiv.className = 'hidden mb-4 p-3 rounded-xl text-xs font-semibold border';
  pwdInput.value = '';

  try {
    const userStr = localStorage.getItem('prepdeck_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
    }
  } catch(e) {
    console.error("Error reading cached user profile:", e);
  }

  // Show Modal
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('opacity-100');
    modal.querySelector('div').classList.remove('scale-95');
    modal.querySelector('div').classList.add('scale-100');
  }, 10);
};

window.closeProfileModal = function() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.remove('opacity-100');
  modal.querySelector('div').classList.remove('scale-100');
  modal.querySelector('div').classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

window.handleProfileSubmit = async function(event) {
  event.preventDefault();
  const name = document.getElementById('profile-name').value;
  const email = document.getElementById('profile-email').value;
  const password = document.getElementById('profile-password').value;
  const alertDiv = document.getElementById('profile-alert');
  const saveBtn = document.getElementById('profile-save-btn');

  alertDiv.className = 'hidden';
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  try {
    const payload = { name, email };
    if (password.trim()) {
      payload.password = password;
    }
    const updated = await api.updateProfile(payload);
    
    alertDiv.innerText = 'Profile updated successfully!';
    alertDiv.className = 'mb-4 p-3 rounded-xl text-xs font-semibold border border-green-500/30 bg-green-500/10 text-green-400';
    
    // Dynamically update UI text elements if they exist
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarName) sidebarName.innerText = updated.name.split(' ')[0] || 'Scholar';
    
    const topAvatar = document.getElementById('top-avatar');
    if (topAvatar) topAvatar.innerHTML = updated.name ? updated.name.charAt(0).toUpperCase() : '?';

    setTimeout(() => {
      closeProfileModal();
    }, 1000);
  } catch(e) {
    alertDiv.innerText = e.message || 'Error updating profile';
    alertDiv.className = 'mb-4 p-3 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400';
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = 'Save Changes';
  }
};

