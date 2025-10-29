// Supabase-backed store for SDP
const Store = (() => {
  // Supabase configuration
  const SUPABASE_URL = 'https://hruttxhdfskiujxcygxf.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydXR0eGhkZnNraXVqeGN5Z3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzQyNjksImV4cCI6MjA3NTkxMDI2OX0.7hM-BhCuy-cZ7f-xXlABq53tuElEKgRReohPzEVc-1w';
  
  // Initialize Supabase client
  let supabase;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.warn('Supabase not available, falling back to localStorage');
    supabase = null;
  }
  
  // Fallback to localStorage for demo purposes
  const KEY = 'skillquest.data.v1';
  const SESS = 'skillquest.session.v1';

  function uid() { return cryptoRandom() + '-' + Date.now().toString(36); }
  function cryptoRandom() {
    try { return Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b=>b.toString(16).padStart(2,'0')).join(''); }
    catch { return Math.random().toString(16).slice(2, 14); }
  }

  function read() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    try { return JSON.parse(raw); } catch { return seed(); }
  }

  function write(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function me() {
    const raw = localStorage.getItem(SESS);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  function login(user) { localStorage.setItem(SESS, JSON.stringify(user)); }
  function logout() { localStorage.removeItem(SESS); }
  function requireRole(role) { const u = me(); return !!(u && u.role === role); }

  // Configurable faculty access code
  function getConfig() {
    const d = read();
    if (!d.config) { d.config = { facultyCode: 'FACULTY-ACCESS-2025' }; write(d); }
    return d.config;
  }
  function setFacultyCode(code) { const d = read(); d.config = d.config || {}; d.config.facultyCode = code; write(d); }

  function seed() {
    const data = {
      users: [],
      programs: [
        { id: uid(), title: 'React Fundamentals', category: 'web-development', description: 'Components, props, state', status: 'upcoming', capacity: 30, participants: [] },
        { id: uid(), title: 'Python for Data Science', category: 'data-science', description: 'Pandas, NumPy, viz', status: 'ongoing', capacity: 25, participants: ['alice@example.com','bob@example.com'] },
        { id: uid(), title: 'Cloud with AWS', category: 'cloud-computing', description: 'EC2, S3, Lambda', status: 'completed', capacity: 20, participants: ['alice@example.com','bob@example.com','carol@example.com'] },
      ],
      feedback: [
        { id: uid(), program_id: null, student_email: 'alice@example.com', student_name: 'Alice', rating: 5, comment: 'Great session!', date: Date.now() },
      ],
      votes: [
        { id: uid(), topic_title: 'Advanced Machine Learning', category: 'ai-ml', votes: 45, voters: [] },
        { id: uid(), topic_title: 'Flutter Mobile', category: 'mobile', votes: 38, voters: [] },
        { id: uid(), topic_title: 'Blockchain Basics', category: 'other', votes: 29, voters: [] },
      ],
      votingOpen: true,
      suggestions: []
    };
    // link feedback to completed program if exists
    if (data.programs[2]) data.feedback[0].program_id = data.programs[2].id;
    write(data);
    return data;
  }
  // Student auth using roll + password (stored locally for demo)
  function registerStudent({ name, roll, password }) {
    const d = read();
    if (d.users.some(u => u.roll.toLowerCase() === roll.toLowerCase())) throw new Error('Roll already registered');
    d.users.push({ id: uid(), role: 'student', name, roll, password });
    write(d);
  }

  function loginStudent({ roll, password }) {
    const d = read();
    let u = d.users.find(u => u.role==='student' && u.roll.toLowerCase()===roll.toLowerCase());
    if (!u) {
      // Implicit first-time registration on login
      u = { id: uid(), role: 'student', name: roll, roll, password };
      d.users.push(u);
      write(d);
    } else {
      if (u.password !== password) throw new Error('Invalid credentials');
    }
    login({ role: 'student', name: u.name, roll: u.roll });
  }

  function ensureSeed() {
    const data = read();
    write(data);
    return {
      countUpcoming: data.programs.filter(p=>p.status==='upcoming').length,
      countEnrollments: data.programs.reduce((a,p)=>a+p.participants.length,0),
      countFeedback: data.feedback.length,
      topTopics: data.votes.map(v=>({ title: v.topic_title, votes: v.votes }))
    };
  }

  function stats() {
    const d = read();
    return {
      programs: d.programs.length,
      registrations: d.programs.reduce((a,p)=>a+p.participants.length,0),
      feedback: d.feedback.length,
    };
  }

  function listPrograms(filter) {
    const d = read();
    if (!filter) return d.programs.slice().sort((a,b)=>a.title.localeCompare(b.title));
    if (Array.isArray(filter)) return d.programs.filter(p=>filter.includes(p.status));
    return d.programs.filter(p=>p.status===filter);
  }

  function getProgram(id) { return read().programs.find(p=>p.id===id); }

  function saveProgram(payload) {
    const d = read();
    if (payload.id) {
      const i = d.programs.findIndex(p=>p.id===payload.id);
      if (i>=0) d.programs[i] = { ...d.programs[i], ...payload };
    } else {
      d.programs.unshift({ id: uid(), title: payload.title, category: payload.category, description: payload.description, status: payload.status || 'upcoming', capacity: payload.capacity ?? 30, participants: [] });
    }
    write(d);
  }

  function deleteProgram(id) {
    const d = read();
    d.programs = d.programs.filter(p=>p.id!==id);
    write(d);
  }

  function enroll(emailOrRoll, programId) {
    const d = read();
    const p = d.programs.find(p=>p.id===programId);
    if (!p) return;
    if (!p.participants.includes(emailOrRoll) && p.participants.length < p.capacity) p.participants.push(emailOrRoll);
    write(d);
  }

  function unenroll(emailOrRoll, programId) {
    const d = read();
    const p = d.programs.find(p=>p.id===programId);
    if (!p) return;
    p.participants = p.participants.filter(e=>e!==emailOrRoll);
    write(d);
  }

  function myEnrollments(identifier) {
    return read().programs.filter(p=>p.participants.includes(identifier));
  }

  function addFeedback(payload) {
    const d = read();
    d.feedback.unshift({ id: uid(), ...payload, date: Date.now() });
    write(d);
  }

  function listFeedback() { return read().feedback.slice(); }

  function listVotes() { return read().votes.slice(); }
  function incrementVote(id) {
    const d = read();
    const v = d.votes.find(x=>x.id===id);
    if (!v) return false;
    if (!v.voters) v.voters = [];
    const user = me();
    const identifier = user?.roll || user?.email;
    if (!identifier) return false;
    if (v.voters.includes(identifier)) return false;
    v.voters.push(identifier);
    v.votes++;
    write(d);
    return true;
  }
  function deleteVote(id) { const d = read(); d.votes = d.votes.filter(v=>v.id!==id); write(d); }
  function addVoteTopic({ title, category }) { const d = read(); d.votes.unshift({ id: uid(), topic_title: title, category: category||'general', votes: 0, voters: [] }); write(d); }
  function updateVoteTopic({ id, title, category }) {
    const d = read();
    const v = d.votes.find(x=>x.id===id);
    if (!v) return;
    if (title !== undefined) v.topic_title = title;
    if (category !== undefined) v.category = category;
    write(d);
  }
  function isVotingOpen() { return !!read().votingOpen; }
  function setVotingOpen(open) { const d = read(); d.votingOpen = !!open; write(d); }

  // Suggestions
  function addSuggestion({ roll, name, text }) {
    const d = read();
    if (!Array.isArray(d.suggestions)) d.suggestions = [];
    d.suggestions.unshift({ id: uid(), roll, name, text, date: Date.now() });
    write(d);
  }
  function listSuggestions() {
    const d = read();
    if (!Array.isArray(d.suggestions)) { d.suggestions = []; write(d); }
    return d.suggestions.slice();
  }

  // Supabase Functions (with localStorage fallback)
  
  // Helper function to check if Supabase is available
  function useSupabase() {
    return supabase && typeof window !== 'undefined' && window.supabase;
  }

  // Supabase Programs Functions
  async function listProgramsSupabase(filter) {
    if (!useSupabase()) return listPrograms(filter);
    
    try {
      let query = supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filter if provided
      if (filter && filter !== 'all') {
        if (Array.isArray(filter)) {
          query = query.in('status', filter);
        } else {
          query = query.eq('status', filter);
        }
      }
      
      const { data: programs, error: programsError } = await query;
      
      if (programsError) throw programsError;
      
      // Get enrollments for each program
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('program_id, student_roll');
      
      if (enrollmentsError) throw enrollmentsError;
      
      // Group enrollments by program
      const enrollmentsByProgram = enrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.program_id]) {
          acc[enrollment.program_id] = [];
        }
        acc[enrollment.program_id].push(enrollment.student_roll);
        return acc;
      }, {});
      
      // Transform data to match localStorage format
      const result = programs.map(p => ({
        ...p,
        participants: enrollmentsByProgram[p.id] || []
      }));
      
      console.log('Supabase programs loaded:', result);
      return result;
    } catch (error) {
      console.error('Supabase error:', error);
      return listPrograms(filter);
    }
  }

  async function saveProgramSupabase(payload) {
    if (!useSupabase()) return saveProgram(payload);
    
    try {
      const { data, error } = payload.id 
        ? await supabase.from('programs').update(payload).eq('id', payload.id).select()
        : await supabase.from('programs').insert([payload]).select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Supabase error:', error);
      return saveProgram(payload);
    }
  }

  async function deleteProgramSupabase(id) {
    if (!useSupabase()) return deleteProgram(id);
    
    try {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Supabase error:', error);
      return deleteProgram(id);
    }
  }

  // Supabase Authentication Functions
  async function loginStudentSupabase({ roll, password }) {
    if (!useSupabase()) return loginStudent({ roll, password });
    
    try {
      // For demo purposes, we'll use email-based auth
      // In production, you'd want to implement proper roll-based auth
      const email = `${roll}@student.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      return {
        role: 'student',
        name: profile?.name || roll,
        roll: roll,
        id: data.user.id
      };
    } catch (error) {
      console.error('Supabase auth error:', error);
      // Fallback to localStorage
      try {
        return loginStudent({ roll, password });
      } catch (localError) {
        throw localError;
      }
    }
  }

  async function registerStudentSupabase({ name, roll, password }) {
    if (!useSupabase()) return registerStudent({ name, roll, password });
    
    try {
      const email = `${roll}@student.local`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'student',
            name: name,
            roll: roll
          }
        }
      });
      
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Supabase registration error:', error);
      return registerStudent({ name, roll, password });
    }
  }

  // Supabase Feedback Functions
  async function addFeedbackSupabase(payload) {
    if (!useSupabase()) return addFeedback(payload);
    
    try {
      const feedbackData = {
        program_id: payload.program_id,
        student_roll: payload.student_roll,
        student_name: payload.student_name,
        rating: payload.rating,
        comment: payload.comment
      };
      
      const { error } = await supabase.from('feedback').insert([feedbackData]);
      if (error) throw error;
    } catch (error) {
      console.error('Supabase error:', error);
      return addFeedback(payload);
    }
  }

  async function listFeedbackSupabase() {
    if (!useSupabase()) return listFeedback();
    
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          programs (title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return listFeedback();
    }
  }

  // Supabase Vote Functions
  async function listVotesSupabase() {
    if (!useSupabase()) return listVotes();
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('votes', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return listVotes();
    }
  }

  async function incrementVoteSupabase(id) {
    if (!useSupabase()) return incrementVote(id);
    
    try {
      const user = me();
      const roll = user?.roll || user?.email;
      if (!roll) return false;
      
      // First, try to insert the vote receipt
      const { error: receiptError } = await supabase.from('vote_receipts').insert([{
        vote_id: id,
        student_roll: roll
      }]);
      
      if (receiptError) {
        // If receipt already exists, user already voted
        if (receiptError.code === '23505') return false;
        throw receiptError;
      }
      
      // If receipt inserted successfully, increment the vote count
      const { error: voteError } = await supabase
        .from('votes')
        .update({ votes: supabase.raw('votes + 1') })
        .eq('id', id);
      
      if (voteError) throw voteError;
      return true;
    } catch (error) {
      console.error('Supabase error:', error);
      return incrementVote(id);
    }
  }

  // Supabase Suggestions Functions
  async function addSuggestionSupabase(payload) {
    if (!useSupabase()) return addSuggestion(payload);
    
    try {
      const { error } = await supabase.from('suggestions').insert([{
        student_roll: payload.roll,
        student_name: payload.name,
        text: payload.text
      }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase error:', error);
      return addSuggestion(payload);
    }
  }

  async function listSuggestionsSupabase() {
    if (!useSupabase()) return listSuggestions();
    
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return listSuggestions();
    }
  }

  // Supabase Enrollment Functions
  async function enrollSupabase(emailOrRoll, programId) {
    if (!useSupabase()) return enroll(emailOrRoll, programId);
    
    try {
      const { error } = await supabase.from('enrollments').insert([{
        program_id: programId,
        student_roll: emailOrRoll
      }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase error:', error);
      return enroll(emailOrRoll, programId);
    }
  }

  async function unenrollSupabase(emailOrRoll, programId) {
    if (!useSupabase()) return unenroll(emailOrRoll, programId);
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('program_id', programId)
        .eq('student_roll', emailOrRoll);
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase error:', error);
      return unenroll(emailOrRoll, programId);
    }
  }

  // Export both localStorage and Supabase functions
  return { 
    // localStorage functions (fallback)
    ensureSeed, stats, listPrograms, getProgram, saveProgram, deleteProgram, 
    enroll, unenroll, myEnrollments, addFeedback, listFeedback, 
    listVotes, incrementVote, deleteVote, addVoteTopic, updateVoteTopic, 
    isVotingOpen, setVotingOpen, addSuggestion, listSuggestions, 
    login, logout, me, requireRole, getConfig, setFacultyCode, 
    registerStudent, loginStudent,
    
    // Supabase functions (primary)
    listProgramsSupabase, saveProgramSupabase, deleteProgramSupabase,
    loginStudentSupabase, registerStudentSupabase,
    addFeedbackSupabase, listFeedbackSupabase,
    listVotesSupabase, incrementVoteSupabase,
    addSuggestionSupabase, listSuggestionsSupabase,
    enrollSupabase, unenrollSupabase,
    
    // Utility
    useSupabase
  };
})();


