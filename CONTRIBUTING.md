# Contributing to Algorhythm

Thank you for your interest in contributing to Algorhythm! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase account (for backend development)

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/algorhythm.git
   cd algorhythm
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Use functional components with hooks
- Add proper error handling
- Include JSDoc comments for functions

### Component Structure
```typescript
interface ComponentProps {
  // Define props with proper types
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### Commit Messages
Use conventional commit format:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Example: `feat: add algorithm visualization controls`

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## 💡 Feature Requests

For new features:
- Describe the feature clearly
- Explain the use case
- Consider implementation complexity
- Check if similar features exist

## 🔧 Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the guidelines

3. Test your changes thoroughly

4. Commit with descriptive messages

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a pull request with:
   - Clear title and description
   - Reference any related issues
   - Screenshots for UI changes
   - Testing instructions

## 🧪 Testing

- Test all new features manually
- Ensure responsive design works
- Check accessibility compliance
- Verify error handling

## 📚 Documentation

- Update README.md for new features
- Add inline code comments
- Update type definitions
- Include usage examples

## 🎯 Areas for Contribution

### Frontend
- New algorithm visualizations
- UI/UX improvements
- Performance optimizations
- Accessibility enhancements

### Backend
- Database optimizations
- New API endpoints
- Security improvements
- Edge function enhancements

### Documentation
- Code documentation
- User guides
- API documentation
- Tutorial content

## ❓ Questions

If you have questions:
- Check existing documentation
- Search closed issues
- Create a discussion thread
- Contact maintainers

Thank you for contributing to Algorhythm! 🎉