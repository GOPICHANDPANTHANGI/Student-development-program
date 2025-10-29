# SkillQuest - Student Development Program Management System

A modern web application for managing student development programs, built with vanilla JavaScript and integrated with Supabase for backend services.

## Features

### For Students
- **Program Enrollment**: Browse and enroll in upcoming/ongoing SDPs
- **Feedback System**: Rate and comment on completed programs
- **Topic Voting**: Vote on topics for future programs
- **Suggestion Box**: Submit ideas for new programs or workshops

### For Faculty/Admin
- **Program Management**: Create, edit, and delete SDPs
- **Registration Tracking**: View and export participant lists
- **Feedback Analytics**: Monitor student feedback and ratings
- **Vote Management**: Add topics and control voting periods
- **Suggestion Review**: View and manage student suggestions

## Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind), Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth with localStorage fallback
- **Database**: PostgreSQL with Row Level Security (RLS)

## Quick Start

### Option 1: Use with Supabase (Recommended)

1. **Set up Supabase Database**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Open your project: `hruttxhdfskiujxcygxf`
   - Navigate to **SQL Editor**
   - Copy and paste the contents of `database-schema.sql`
   - Click **Run** to create the database schema

2. **Configure Authentication**:
   - Go to **Authentication** → **Settings**
   - Ensure **Email** provider is enabled
   - Set your site URL (e.g., `http://localhost:3000`)

3. **Open the Application**:
   - Open `index.html` in your browser
   - The app will automatically use Supabase for data storage

### Option 2: Local Demo Mode

- Simply open `index.html` in your browser
- The app will use localStorage for demo purposes
- No setup required - works offline

## File Structure

```
skillquest-web/
├── index.html              # Landing page
├── student.html            # Student portal
├── admin.html              # Faculty admin dashboard
├── auth-student.html       # Student login/registration
├── auth-faculty.html       # Faculty login
├── analytics.html          # Analytics dashboard
├── js/
│   └── store.js           # Data layer with Supabase + localStorage
├── database-schema.sql    # Database setup script
├── SUPABASE_SETUP.md      # Detailed setup guide
└── README.md              # This file
```

## Authentication

### Students
- **Registration**: Name, Roll Number, Password
- **Login**: Roll Number + Password
- **Auto-registration**: First-time login creates account automatically

### Faculty
- **Access Code**: `FACULTY-ACCESS-2025` (configurable)
- **Admin Rights**: Full program management capabilities

## Database Schema

The application uses the following main tables:
- `users` - User profiles and roles
- `programs` - SDP information and metadata
- `program_participants` - Enrollment tracking
- `feedback` - Student ratings and comments
- `vote_topics` - Voting topics with vote counts
- `votes` - Individual vote records
- `suggestions` - Student suggestions
- `config` - System configuration

## Key Features

### Hybrid Data Layer
- **Primary**: Supabase for production use
- **Fallback**: localStorage for demo/offline mode
- **Automatic**: Seamless switching between modes

### Real-time Updates
- Live data synchronization across browser tabs
- Automatic refresh when data changes
- Optimistic UI updates for better UX

### Security
- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication with Supabase Auth

## Development

### Adding New Features
1. Update the database schema in `database-schema.sql`
2. Add corresponding functions in `js/store.js`
3. Update the UI components in respective HTML files
4. Test with both Supabase and localStorage modes

### Customization
- Modify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `store.js`
- Update styling in the HTML files (using Tailwind CSS)
- Configure RLS policies in the database schema

## Troubleshooting

### Common Issues
1. **"Supabase not available"**: App falls back to localStorage automatically
2. **Authentication errors**: Check Supabase Auth settings
3. **Database errors**: Verify schema is properly set up

### Debug Mode
- Open browser console for detailed error messages
- Check Supabase dashboard logs for backend issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both Supabase and localStorage modes
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the `SUPABASE_SETUP.md` guide
3. Open an issue in the repository

---

**Note**: This application is designed to work seamlessly in both production (with Supabase) and demo (localStorage) modes, ensuring reliability and ease of deployment.

