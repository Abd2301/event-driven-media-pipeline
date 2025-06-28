# Task Manager Frontend

A modern React-based frontend for the Event-Driven Media Pipeline Task Management System.

## Features

- **Task Management**: Create, read, update, and delete tasks
- **Real-time Updates**: Automatic data synchronization with React Query
- **Advanced Filtering**: Filter tasks by status, priority, and search terms
- **Responsive Design**: Works on desktop and mobile devices
- **Material-UI**: Modern, accessible UI components
- **TypeScript**: Full type safety and better developer experience

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI component library
- **React Query (TanStack Query)** - Data fetching and caching
- **React Hook Form** - Form handling
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (CDK stack deployed)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/dev
   REACT_APP_API_KEY=your-api-key-here
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API Gateway URL | `http://localhost:3000` |
| `REACT_APP_API_KEY` | API Key for authentication | `''` |

## Project Structure

```
src/
├── components/          # React components
│   ├── TaskCard.tsx    # Individual task display
│   ├── TaskForm.tsx    # Task creation/editing form
│   └── TaskList.tsx    # Main task list with filters
├── hooks/              # Custom React hooks
│   └── useTasks.ts     # React Query hooks for tasks
├── services/           # API services
│   └── api.ts          # API client and types
├── config.ts           # Application configuration
└── App.tsx             # Main application component
```

## API Integration

The frontend integrates with the following backend endpoints:

- `GET /health` - Health check
- `GET /tasks` - List all tasks
- `POST /tasks` - Create new task
- `GET /tasks/{id}` - Get specific task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add API methods in `src/services/api.ts`
3. Create custom hooks in `src/hooks/`
4. Update types as needed

### Styling

The app uses Material-UI's theming system. To customize:

1. Modify the theme in `App.tsx`
2. Use MUI's `sx` prop for component-specific styles
3. Create custom styled components if needed

### State Management

- **Server State**: Managed by React Query
- **Client State**: Managed by React hooks (useState, useReducer)
- **Form State**: Managed by React Hook Form

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to CloudFront

The frontend is designed to be deployed to AWS CloudFront. The build output can be uploaded to an S3 bucket and served via CloudFront.

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Check your `REACT_APP_API_URL` and `REACT_APP_API_KEY`
2. **CORS Errors**: Ensure your backend has CORS properly configured
3. **Type Errors**: Run `npm install` to ensure all dependencies are installed

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of the Event-Driven Media Pipeline and follows the same license terms.
