import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

const ResetSent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md church-card p-6 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Reset link sent</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for the email you provided, weve sent a password reset link. Please check your inbox
          (and spam folder). The link will expire in 30 minutes.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Didnt receive an email? Wait a few minutes and try again. You can also contact your church admin for help.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetSent;
