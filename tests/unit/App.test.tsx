
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import LoginScreen from '../../components/LoginScreen';

describe('LoginScreen Component', () => {
  test('renders login header and role buttons', () => {
    render(<LoginScreen onLogin={() => {}} />);
    expect(screen.getByText('GlobalReach Login')).toBeInTheDocument();
    expect(screen.getByText('Secure Access Portal')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('updates name input field', () => {
    render(<LoginScreen onLogin={() => {}} />);
    const input = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'John Doe' } });
    expect(input.value).toBe('John Doe');
  });

  test('clicking login triggers authentication state', () => {
    render(<LoginScreen onLogin={() => {}} />);
    const button = screen.getByText('Sign In');
    fireEvent.click(button);
    // It should show loading state
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });
});
