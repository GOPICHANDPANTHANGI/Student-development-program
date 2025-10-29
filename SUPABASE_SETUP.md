# Supabase Setup Guide for SkillQuest

## 1. Database Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Open your project: `hruttxhdfskiujxcygxf`
3. Navigate to the **SQL Editor**
4. Copy and paste the contents of `database-schema.sql` into the SQL editor
5. Click **Run** to execute the schema

## 2. Authentication Setup

### Enable Email Authentication
1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure your site URL (e.g., `http://localhost:3000` for local development)

### Configure RLS Policies
The database schema includes Row Level Security (RLS) policies that are already configured. These policies ensure:
- Students can only access their own data
- Faculty can manage programs and configurations
- Anonymous users can view public data like programs and vote topics

## 3. Environment Configuration

The application is already configured with your Supabase credentials:
- **URL**: `https://hruttxhdfskiujxcygxf.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 4. Testing the Integration

### For Students:
1. Open `student.html`
2. The app will automatically fall back to localStorage if Supabase is not set up
3. Once Supabase is configured, it will use the database

### For Faculty:
1. Open `admin.html`
2. Use the faculty access code: `FACULTY-ACCESS-2025`
3. The app will sync data with Supabase

## 5. Data Migration

### Automatic Fallback:
- The application includes both Supabase and localStorage functions
- If Supabase fails, it automatically falls back to localStorage
- This ensures the app works even during setup

### Manual Migration (if needed):
If you have existing data in localStorage that you want to migrate:

1. Export data from localStorage:
```javascript
// Run in browser console
console.log(JSON.stringify(localStorage.getItem('skillquest.data.v1')));
```

2. Import to Supabase using the dashboard or SQL inserts

## 6. Features Available

### With Supabase:
- ✅ Real-time data synchronization
- ✅ User authentication
- ✅ Row-level security
- ✅ Automatic vote counting
- ✅ Persistent data storage
- ✅ Multi-user support

### Fallback (localStorage):
- ✅ Offline functionality
- ✅ Demo mode
- ✅ No setup required

## 7. Troubleshooting

### Common Issues:

1. **"Supabase not available" error**
   - Check if the Supabase script is loaded
   - Verify your internet connection
   - The app will fall back to localStorage

2. **Authentication errors**
   - Ensure email authentication is enabled in Supabase
   - Check RLS policies are correctly set up

3. **Database errors**
   - Verify the schema was run successfully
   - Check the Supabase logs in the dashboard

### Debug Mode:
Open browser console to see detailed error messages and fallback behavior.

## 8. Next Steps

1. Run the database schema
2. Test student registration and login
3. Test faculty access with the provided code
4. Verify all features work with Supabase
5. Customize the UI and add additional features as needed

The application is designed to work seamlessly with both Supabase and localStorage, ensuring a smooth transition and reliable operation.
