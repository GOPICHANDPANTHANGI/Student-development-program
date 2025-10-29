// Supabase-backed store for SDP
const Store = (() => {
  // Supabase configuration - These are public anon keys, safe for client-side use
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
    try { 
      return Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''); 
    } catch { 
      return Math.random().toString(16).slice(2, 14); 
    }
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
  function requireRole(role) { 
    const u = me(); 
    if (!u || !u.role) {
      logout(); // Clear invalid session
      return false;
    }
    // Allow both 'admin' and 'faculty' roles to access admin functions
    if (role === 'admin' && (u.role === 'admin' || u.role === 'faculty')) {
      return true;
    }
    if (u.role !== role) {
      logout(); // Clear invalid session
      return false;
    }
    return true;
  }

  // Configurable admin access code
  function getConfig() {
    const d = read();
    if (!d.config) { d.config = { adminCode: 'IT2025', facultyCode: 'IT2025' }; write(d); }
    return d.config;
  }
  function setAdminCode(code) { const d = read(); d.config = d.config || {}; d.config.adminCode = code; write(d); }

  function seed() {
    const data = {
      users: [],
      programs: [],
      feedback: [],
      votes: [],
      votingOpen: true,
      suggestions: []
    };
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
    if (!roll || !password) {
      throw new Error('Roll number and password are required.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    
    const d = read();
    const u = d.users.find(u => u.role==='student' && u.roll.toLowerCase()===roll.toLowerCase());
    if (!u) {
      throw new Error('Roll number not found. Please register first.');
    }
    if (u.password !== password) {
      throw new Error('Incorrect password. Please check and try again.');
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
      const i = d.programs.findIndex(p => p.id === payload.id);
      if (i >= 0) d.programs[i] = { ...d.programs[i], ...payload };
    } else {
      d.programs.unshift({ 
        id: uid(), 
        title: payload.title, 
        category: payload.category, 
        description: payload.description, 
        status: payload.status || 'upcoming', 
        capacity: payload.capacity ?? 30, 
        participants: [] 
      });
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
    if (!p) return false;
    if (p.participants.includes(emailOrRoll)) return false; // Already enrolled
    if (p.participants.length >= (p.capacity || 30)) return false; // Capacity full
    p.participants.push(emailOrRoll);
    write(d);
    return true;
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
  async function deleteVote(id) { 
    if (useSupabase()) {
      try {
        const { error } = await supabase.from('votes').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Supabase delete vote error:', error);
        const d = read(); 
        d.votes = d.votes.filter(v=>v.id!==id); 
        write(d);
      }
    } else {
      const d = read(); 
      d.votes = d.votes.filter(v=>v.id!==id); 
      write(d);
    }
  }
  async function addVoteTopic({ title, category }) { 
    if (useSupabase()) {
      try {
        console.log('🔄 Adding vote topic to Supabase:', { title, category });
        const { data, error } = await supabase.from('votes').insert([{
          topic_title: title, 
          category: category || 'general', 
          votes: 0
        }]).select();
        if (error) throw error;
        console.log('✅ Vote topic added to Supabase:', data);
        return data;
      } catch (error) {
        console.error('❌ Supabase vote topic error:', error);
        throw error;
      }
    } else {
      const d = read(); 
      d.votes.unshift({ id: uid(), topic_title: title, category: category||'general', votes: 0, voters: [] }); 
      write(d);
      console.log('✅ Vote topic added to localStorage');
    }
  }
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

  // Test database connection
  async function testConnection() {
    if (!useSupabase()) {
      console.log('❌ Supabase not available - using localStorage');
      return false;
    }
    
    try {
      const { error } = await supabase.from('programs').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message || error);
      return false;
    }
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
      if (payload.id) {
        // Update existing program
        const updateData = { ...payload };
        delete updateData.id;
        const { data, error } = await supabase
          .from('programs')
          .update(updateData)
          .eq('id', payload.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        // Create new program
        const insertData = {
          title: payload.title,
          category: payload.category,
          description: payload.description,
          status: payload.status || 'upcoming',
          capacity: payload.capacity || 30
        };
        const { data, error } = await supabase
          .from('programs')
          .insert([insertData])
          .select();
        if (error) throw error;
        return data[0];
      }
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
    
    // Strong validation
    if (!roll || !password) {
      throw new Error('Roll number and password are required.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    
    try {
      console.log('🔍 Looking for user with roll:', roll);
      
      // Check if user exists in profiles table
      const { data: existingUser, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('roll', roll)
        .maybeSingle();
      
      if (selectError) {
        console.error('❌ Error checking user:', selectError);
        throw selectError;
      }
      
      if (!existingUser) {
        throw new Error('Roll number not found. Please register first.');
      }
      
      console.log('✅ User found in Supabase:', existingUser);
      
      // Validate password
      if (existingUser.password !== password) {
        throw new Error('Incorrect password. Please check and try again.');
      }
      
      // Set session
      login({ role: 'student', name: existingUser.name, roll: existingUser.roll });
      
      return {
        role: 'student',
        name: existingUser.name,
        roll: existingUser.roll
      };
    } catch (error) {
      console.error('❌ Supabase login error:', error.message || error);
      throw error;
    }
  }

  async function registerStudentSupabase({ name, roll, password }) {
    if (!useSupabase()) return registerStudent({ name, roll, password });
    
    try {
      console.log('🔍 Checking if roll exists:', roll);
      
      // Check if roll already exists
      const { data: existing, error: selectError } = await supabase
        .from('profiles')
        .select('roll')
        .eq('roll', roll)
        .maybeSingle();
      
      if (selectError) {
        console.error('❌ Error checking existing user:', selectError);
        throw selectError;
      }
      
      if (existing) {
        throw new Error('Roll already registered');
      }
      
      console.log('✅ Roll available, inserting new user...');
      
      // Insert new user with password
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          name: name,
          roll: roll,
          role: 'student',
          password: password
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error inserting user:', error);
        throw error;
      }
      
      console.log('✅ User registered successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Supabase registration failed:', error.message || error);
      throw error;
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
      // Get votes with vote receipts to track who voted
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .order('votes', { ascending: false });
      
      if (votesError) throw votesError;
      
      // Get vote receipts to see who voted
      const { data: receipts, error: receiptsError } = await supabase
        .from('vote_receipts')
        .select('vote_id, student_roll');
      
      if (receiptsError) throw receiptsError;
      
      // Add voters array to each vote
      const votesWithVoters = votes.map(vote => {
        const voters = receipts
          .filter(r => r.vote_id === vote.id)
          .map(r => r.student_roll);
        return { ...vote, voters };
      });
      
      return votesWithVoters;
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
      const { data: currentVote } = await supabase
        .from('votes')
        .select('votes')
        .eq('id', id)
        .single();
      
      const { error: voteError } = await supabase
        .from('votes')
        .update({ votes: (currentVote?.votes || 0) + 1 })
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
      // First check if program exists and has capacity
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('capacity')
        .eq('id', programId)
        .single();
      
      if (programError) throw programError;
      
      // Check current enrollment count
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('student_roll')
        .eq('program_id', programId);
      
      if (enrollmentError) throw enrollmentError;
      
      // Check if already enrolled
      if (enrollments.some(e => e.student_roll === emailOrRoll)) {
        return false; // Already enrolled
      }
      
      // Check capacity
      if (enrollments.length >= (program.capacity || 30)) {
        return false; // Capacity full
      }
      
      // Proceed with enrollment
      const { error } = await supabase.from('enrollments').insert([{
        program_id: programId,
        student_roll: emailOrRoll
      }]);
      
      if (error) throw error;
      return true;
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

  // Clear all Supabase data
  async function clearAllDataSupabase() {
    if (!useSupabase()) return;
    
    try {
      // Clear all tables in order (respecting foreign key constraints)
      await supabase.from('vote_receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('enrollments').delete().neq('program_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('programs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('All Supabase data cleared');
    } catch (error) {
      console.error('Error clearing Supabase data:', error);
      throw error;
    }
  }

  // Export both localStorage and Supabase functions
  return { 
    // localStorage functions (fallback)
    ensureSeed, stats, listPrograms, getProgram, saveProgram, deleteProgram, 
    enroll, unenroll, myEnrollments, addFeedback, listFeedback, 
    listVotes, incrementVote, deleteVote, addVoteTopic, updateVoteTopic, 
    isVotingOpen, setVotingOpen, addSuggestion, listSuggestions, 
    login, logout, me, requireRole, getConfig, setAdminCode, 
    registerStudent, loginStudent,
    
    // Supabase functions (primary)
    listProgramsSupabase, saveProgramSupabase, deleteProgramSupabase,
    loginStudentSupabase, registerStudentSupabase,
    addFeedbackSupabase, listFeedbackSupabase,
    listVotesSupabase, incrementVoteSupabase,
    addSuggestionSupabase, listSuggestionsSupabase,
    enrollSupabase, unenrollSupabase,
    clearAllDataSupabase,
    
    // Utility
    useSupabase, testConnection
  };
})();


