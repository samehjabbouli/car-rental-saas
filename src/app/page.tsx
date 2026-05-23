import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard after login
  redirect('/login-test');
}