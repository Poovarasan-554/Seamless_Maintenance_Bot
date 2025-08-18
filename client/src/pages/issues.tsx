import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Search, Loader2, LogOut } from "lucide-react";

interface IssueDetails {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  created: string;
  updated: string;
}

interface SimilarIssue {
  id: number;
  title: string;
  status: string;
  priority: string;
  source: 'redmine' | 'mantis';
}

export default function Issues() {
  const [, setLocation] = useLocation();
  const [issueId, setIssueId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [showNoMatches, setShowNoMatches] = useState(false);
  const [showRCAContent, setShowRCAContent] = useState(false);

  const username = localStorage.getItem("username") || "User";

  // Dummy similar issues data
  const mockRedmineIssues: SimilarIssue[] = [
    { id: 101, title: 'Login fails', status: 'Open', priority: 'High', source: 'redmine' },
    { id: 102, title: 'Session timeout too fast', status: 'In Progress', priority: 'Medium', source: 'redmine' },
    { id: 103, title: 'Login button not working', status: 'Open', priority: 'High', source: 'redmine' },
    { id: 104, title: 'Incorrect error on login', status: 'Open', priority: 'Medium', source: 'redmine' },
    { id: 105, title: 'UI freeze on login', status: 'Resolved', priority: 'Low', source: 'redmine' }
  ];

  const mockMantisIssues: SimilarIssue[] = [
    { id: 201, title: 'Login redirect broken', status: 'Open', priority: 'High', source: 'mantis' },
    { id: 202, title: 'Cannot logout after login', status: 'In Progress', priority: 'Medium', source: 'mantis' },
    { id: 203, title: 'Login test cases failing', status: 'Open', priority: 'High', source: 'mantis' },
    { id: 204, title: 'Wrong credentials not handled', status: 'Open', priority: 'Medium', source: 'mantis' },
    { id: 205, title: 'JS error on login screen', status: 'Resolved', priority: 'Low', source: 'mantis' }
  ];

  const validateIssueId = (id: string): boolean => {
    const numericId = parseInt(id);
    return !isNaN(numericId) && numericId > 0 && id.toString() === numericId.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    setLocation("/login");
  };

  const handleFetchIssue = () => {
    setError('');
    setIssueDetails(null);
    setShowSimilar(false);
    setSimilarIssues([]);
    setSelectedIssue('');

    if (!issueId.trim()) {
      setError('Issue ID is required');
      return;
    }

    if (!validateIssueId(issueId)) {
      setError('Please enter a valid numeric Issue ID');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockData: IssueDetails = {
        id: parseInt(issueId),
        title: `Sample Issue #${issueId}: API Integration Problem`,
        description: 'The REST API endpoints are returning inconsistent response formats, causing parsing errors in the frontend application. This affects user data synchronization and may lead to data loss.',
        status: 'Open',
        priority: 'High',
        assignee: 'John Doe',
        created: '2024-01-15 10:30:00',
        updated: '2024-01-20 14:22:00'
      };
      
      setIssueDetails(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const handleFetchSimilarIssues = () => {
    // Check for special case: no matches scenario
    if (parseInt(issueId) === 99999) {
      setShowNoMatches(true);
      setShowSimilar(false);
      setShowRCAContent(false);
    } else {
      setShowSimilar(true);
      setShowNoMatches(false);
      setSimilarIssues([...mockRedmineIssues, ...mockMantisIssues]);
    }
    setSelectedIssue('');
  };

  const handleFindRCA = () => {
    setShowRCAContent(true);
  };

  const handleContinue = () => {
    if (selectedIssue) {
      const issue = similarIssues.find(i => i.id.toString() === selectedIssue);
      alert(`You selected: ${issue?.title} (${issue?.source.toUpperCase()} #${issue?.id})`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchIssue();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Open':
        return 'destructive';
      case 'In Progress':
        return 'secondary';
      case 'Resolved':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const renderIssueCard = (issue: SimilarIssue) => {
    const isSelected = selectedIssue === issue.id.toString();
    return (
      <div 
        key={issue.id}
        className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedIssue(issue.id.toString())}
        data-testid={`card-issue-${issue.id}`}
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem 
            value={issue.id.toString()} 
            id={`issue-${issue.id}`}
            className="mt-1"
            data-testid={`radio-issue-${issue.id}`}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900" data-testid={`text-issue-title-${issue.id}`}>
                #{issue.id}: {issue.title}
              </h4>
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(issue.status)} data-testid={`badge-status-${issue.id}`}>
                {issue.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(issue.priority)} data-testid={`badge-priority-${issue.id}`}>
                {issue.priority}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              Issue Tracker
            </h1>
            <p className="text-lg text-gray-600">Welcome back, {username}!</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            data-testid="button-logout"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-8 shadow-lg border-2 border-blue-100 bg-white">
          <CardContent className="p-0">
            <div className="space-y-4">
              <div>
                <Label htmlFor="issueId" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue ID (Try 99999 for no matches scenario)
                </Label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      id="issueId"
                      data-testid="input-issue-id"
                      value={issueId}
                      onChange={(e) => setIssueId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter issue ID (e.g., 1234 or 99999)"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400"
                    />
                    {error && (
                      <p className="mt-2 text-sm text-red-500 flex items-center" data-testid="text-error">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {error}
                      </p>
                    )}
                  </div>
                  <Button
                    data-testid="button-fetch-issue"
                    onClick={handleFetchIssue}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Fetching...
                      </>
                    ) : (
                      'Fetch Issue'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Details */}
        {issueDetails && (
          <Card className="p-6 mb-8 shadow-lg border-2 border-green-100 bg-white" data-testid="card-issue-details">
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900" data-testid="text-issue-title">
                    #{issueDetails.id}: {issueDetails.title}
                  </h2>
                  <Badge variant={getStatusBadgeVariant(issueDetails.status)} data-testid="badge-status">
                    {issueDetails.status}
                  </Badge>
                </div>
                
                <p className="text-gray-700" data-testid="text-issue-description">
                  {issueDetails.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Priority:</span>
                    <div className="mt-1">
                      <Badge variant={getPriorityBadgeVariant(issueDetails.priority)} data-testid="badge-priority">
                        {issueDetails.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Assignee:</span>
                    <p className="text-gray-900 mt-1" data-testid="text-assignee">{issueDetails.assignee}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Created:</span>
                    <p className="text-gray-700 mt-1" data-testid="text-created">{issueDetails.created}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Updated:</span>
                    <p className="text-gray-700 mt-1" data-testid="text-updated">{issueDetails.updated}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    data-testid="button-fetch-similar"
                    onClick={handleFetchSimilarIssues}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Fetch Similar Issues
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Matches Scenario */}
        {showNoMatches && (
          <Card className="p-6 mb-8 shadow-lg border-2 border-orange-200 bg-orange-50" data-testid="card-no-matches">
            <CardContent className="p-0 text-center">
              <h2 className="text-xl font-semibold text-orange-800 mb-4">
                No Matches Found
              </h2>
              <div className="text-4xl mb-4">❌</div>
              <p className="text-gray-700 mb-6">
                No Matches Found. Kindly find RCA
              </p>
              <Button
                data-testid="button-find-rca"
                onClick={handleFindRCA}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
              >
                🔍 Find RCA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RCA Content */}
        {showRCAContent && (
          <Card className="p-6 mb-8 shadow-lg border-2 border-yellow-200 bg-yellow-50" data-testid="card-rca-content">
            <CardContent className="p-0">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Suggested RCA</h3>
              <div className="bg-white border border-yellow-300 rounded-lg p-4">
                <p className="text-gray-800">
                  <strong>Suggested RCA:</strong><br/>
                  Login issue caused by an outdated session token validation library.<br/>
                  Issue is reproducible only on legacy builds.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Similar Issues with Radio Selection */}
        {showSimilar && similarIssues.length > 0 && (
          <Card className="p-6 shadow-lg border-2 border-indigo-100 bg-white" data-testid="container-similar-issues">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Similar Issues</h2>
                <p className="text-sm text-gray-500">Select one issue to continue</p>
              </div>
              
              <RadioGroup value={selectedIssue} onValueChange={setSelectedIssue}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Redmine Issues */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-red-700 border-b border-red-200 pb-2">
                      Redmine Issues
                    </h3>
                    <div className="space-y-3" data-testid="container-redmine-issues">
                      {mockRedmineIssues.map(renderIssueCard)}
                    </div>
                  </div>
                  
                  {/* Mantis Issues */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-blue-700 border-b border-blue-200 pb-2">
                      Mantis Issues
                    </h3>
                    <div className="space-y-3" data-testid="container-mantis-issues">
                      {mockMantisIssues.map(renderIssueCard)}
                    </div>
                  </div>
                </div>
              </RadioGroup>
              
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <Button
                  data-testid="button-continue"
                  onClick={handleContinue}
                  disabled={!selectedIssue}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  Continue with Selected Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}