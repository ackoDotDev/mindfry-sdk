# Contributing to MindFry SDK

Thank you for your interest in contributing to MindFry SDK! This document provides guidelines for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment**:

   ```bash
   # Install dependencies
   pnpm install

   # Build all packages
   pnpm build

   # Run tests
   pnpm test
   ```

## Project Structure

```
mindfry-sdk/
├── packages/
│   ├── protocol/    # @mindfry/protocol - MFBP types and encoding
│   └── client/      # @mindfry/client - Main SDK
```

## Development Workflow

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/modifications

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(client): add connection pooling support
fix(protocol): handle UTF-8 edge cases in string encoding
docs: update README with new API examples
test(client): add integration tests for pipelining
```

### Code Standards

- **TypeScript Strict Mode**: All code must pass strict type checking
- **Tests Required**: New features must include tests
- **Documentation**: Public APIs must have JSDoc comments
- **Formatting**: Run `pnpm format` before committing (Prettier)
- **Linting**: Run `pnpm lint` and address any issues (ESLint)

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear, atomic commits
3. **Write or update tests** as needed
4. **Update documentation** if applicable
5. **Open a Pull Request** with a clear description
6. **Address review feedback** promptly

### PR Checklist

- [ ] Code compiles without errors (`pnpm build`)
- [ ] All tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation is updated (if applicable)
- [ ] CHANGELOG.md is updated (if user-facing)

## Adding New Language SDKs

We welcome SDK contributions for other languages! Please:

1. Open an issue first to discuss the implementation plan
2. Follow the existing protocol specification exactly
3. Include comprehensive tests
4. Document any language-specific considerations

## Questions?

- Open a [Discussion](https://github.com/cluster-127/mindfry-sdk/discussions) for questions
- Check existing [Issues](https://github.com/cluster-127/mindfry-sdk/issues) before opening a new one

## License

By contributing, you agree that your contributions will be licensed under the project's MIT license.
