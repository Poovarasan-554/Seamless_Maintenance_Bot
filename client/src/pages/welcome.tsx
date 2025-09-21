import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles, Target, Zap } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const username = localStorage.getItem("username");
  const userFullName = localStorage.getItem("userFullName");
  const displayName = userFullName || username || "Guest";

  useEffect(() => {
    setShowAnimation(true);
    
    // Auto-advance animation steps
    const timer = setTimeout(() => {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleContinue = () => {
    setLocation("/issues");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Animated Welcome Header */}
          <div className={`transform transition-all duration-1000 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-white animate-spin" style={{animationDuration: '3s'}} />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome Back!
            </h1>
            <p className="text-2xl text-gray-700 mb-2">
              Hello, <span className="font-semibold text-purple-600">{displayName}</span> 🎉
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Ready to track and analyze issues like never before?
            </p>
          </div>

          {/* Feature Highlights with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className={`transform transition-all duration-700 delay-300 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className={`w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${currentStep >= 1 ? 'scale-110' : 'scale-100'}`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-green-900 mb-2">Smart Search</h3>
                <p className="text-sm text-green-700">Find issues across Redmine & Mantis systems instantly</p>
              </div>
            </div>
            
            <div className={`transform transition-all duration-700 delay-500 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className={`w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${currentStep >= 2 ? 'scale-110' : 'scale-100'}`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-purple-900 mb-2">AI Analysis</h3>
                <p className="text-sm text-purple-700">Get intelligent recommendations and insights</p>
              </div>
            </div>
            
            <div className={`transform transition-all duration-700 delay-700 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${currentStep >= 3 ? 'scale-110' : 'scale-100'}`}>
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Quick Resolution</h3>
                <p className="text-sm text-blue-700">Access fix details and migration queries</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className={`transform transition-all duration-1000 delay-1000 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
              <h2 className="text-2xl font-bold mb-4">🚀 Let's Get Started!</h2>
              <p className="text-blue-100 mb-6">
                Your journey to efficient issue tracking and resolution begins now. 
                Explore powerful features designed to streamline your workflow.
              </p>
              <Button
                onClick={handleContinue}
                data-testid="button-continue-to-dashboard"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Quick Tip */}
          <div className={`transform transition-all duration-1000 delay-1200 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                💡 <strong>Pro Tip:</strong> Use the User Guide button (❔) in the top-right corner anytime you need help!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}