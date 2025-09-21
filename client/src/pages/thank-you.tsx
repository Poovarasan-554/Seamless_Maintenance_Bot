import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Shield, ArrowLeft, Sparkles } from "lucide-react";

export default function ThankYou() {
  const [, setLocation] = useLocation();
  const [showAnimation, setShowAnimation] = useState(false);
  const [heartBeat, setHeartBeat] = useState(0);

  useEffect(() => {
    setShowAnimation(true);
    
    // Animate heart beat effect
    const heartTimer = setInterval(() => {
      setHeartBeat(prev => prev + 1);
    }, 1500);

    // Auto redirect after 10 seconds
    const redirectTimer = setTimeout(() => {
      setLocation("/login");
    }, 10000);

    return () => {
      clearInterval(heartTimer);
      clearTimeout(redirectTimer);
    };
  }, [setLocation]);

  const handleBackToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Animated Thank You Header */}
          <div className={`transform transition-all duration-1000 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-blue-600 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center mb-6">
                <Heart className={`w-12 h-12 text-white transition-transform duration-300 ${heartBeat % 2 === 0 ? 'scale-110' : 'scale-100'}`} />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Thank You!
            </h1>
            <p className="text-2xl text-gray-700 mb-2">
              We appreciate you using our application 💙
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Your session has been safely logged out
            </p>
          </div>

          {/* Appreciation Message */}
          <div className={`transform transition-all duration-1000 delay-300 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 mb-8 border border-green-200">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-green-500 mr-3 animate-spin" style={{animationDuration: '3s'}} />
                <h2 className="text-2xl font-bold text-gray-800">Mission Accomplished!</h2>
                <Sparkles className="w-8 h-8 text-blue-500 ml-3 animate-spin" style={{animationDuration: '3s'}} />
              </div>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                We hope our Issue Tracker helped you find the solutions you were looking for. 
                Your productivity and success drive our passion for building better tools.
              </p>

              {/* Features Highlight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900 mb-1">Secure</h3>
                  <p className="text-sm text-green-700">Your data is always protected</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-1">Efficient</h3>
                  <p className="text-sm text-blue-700">Fast and reliable results</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <Heart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900 mb-1">User-Focused</h3>
                  <p className="text-sm text-purple-700">Built with you in mind</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border border-green-300">
                <p className="text-sm text-gray-600">
                  <strong>What's Next?</strong> Feel free to log back in anytime to continue tracking and analyzing issues. 
                  We're constantly improving to serve you better!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`transform transition-all duration-1000 delay-600 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="space-y-4">
              <Button
                onClick={handleBackToLogin}
                data-testid="button-back-to-login"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Login
              </Button>
              
              <p className="text-sm text-gray-500">
                Auto-redirecting to login in <span className="font-mono">10</span> seconds...
              </p>
            </div>
          </div>

          {/* Footer Message */}
          <div className={`transform transition-all duration-1000 delay-900 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                "Great software is built by understanding great workflows." 
                <br />
                <span className="text-green-600 font-medium">- The Issue Tracker Team</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}