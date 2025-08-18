import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Search, Loader2, LogOut, User, Calendar, Clock, ArrowLeft, Eye, Code, GitBranch } from "lucide-react";

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
  description?: string;
  assignee?: string;
  contactPerson?: string;
  closedBy?: string;
  created?: string;
  updated?: string;
  resolution?: string;
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
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState('');
  const [selectedIssueDetails, setSelectedIssueDetails] = useState<SimilarIssue | null>(null);

  const username = localStorage.getItem("username") || "User";

  // Dummy similar issues data with enhanced details
  const mockRedmineIssues: SimilarIssue[] = [
    { 
      id: 101, 
      title: 'Login fails', 
      status: 'Open', 
      priority: 'High', 
      source: 'redmine',
      description: 'Users are unable to login after entering correct credentials. The login form shows a generic error message.',
      assignee: 'Sarah Johnson',
      contactPerson: 'Mike Wilson',
      created: '2024-01-10 09:15:00',
      updated: '2024-01-18 14:30:00'
    },
    { 
      id: 102, 
      title: 'Session timeout too fast', 
      status: 'In Progress', 
      priority: 'Medium', 
      source: 'redmine',
      description: 'User sessions are expiring after only 5 minutes of inactivity instead of the expected 30 minutes.',
      assignee: 'Alex Chen',
      contactPerson: 'Jennifer Davis',
      created: '2024-01-12 11:20:00',
      updated: '2024-01-19 16:45:00'
    },
    { 
      id: 103, 
      title: 'Login button not working', 
      status: 'Open', 
      priority: 'High', 
      source: 'redmine',
      description: 'The login button becomes unresponsive on certain browsers after multiple failed attempts.',
      assignee: 'David Rodriguez',
      contactPerson: 'Lisa Thompson',
      created: '2024-01-14 13:30:00',
      updated: '2024-01-20 10:15:00'
    },
    { 
      id: 104, 
      title: 'Incorrect error on login', 
      status: 'Open', 
      priority: 'Medium', 
      source: 'redmine',
      description: 'Wrong error message displayed when user enters invalid credentials.',
      assignee: 'Emma Taylor',
      contactPerson: 'Robert Brown',
      created: '2024-01-16 15:45:00',
      updated: '2024-01-21 12:20:00'
    },
    { 
      id: 105, 
      title: 'UI freeze on login', 
      status: 'Resolved', 
      priority: 'Low', 
      source: 'redmine',
      description: 'Login interface occasionally freezes during authentication process on slower connections.',
      assignee: 'Kevin White',
      contactPerson: 'Amanda Green',
      closedBy: 'John Miller',
      created: '2024-01-08 08:00:00',
      updated: '2024-01-22 17:30:00',
      resolution: 'Fixed by optimizing authentication timeout settings'
    }
  ];

  const mockMantisIssues: SimilarIssue[] = [
    { 
      id: 201, 
      title: 'Login redirect broken', 
      status: 'Open', 
      priority: 'High', 
      source: 'mantis',
      description: 'After successful login, users are redirected to a blank page instead of the dashboard.',
      assignee: 'Rachel Kim',
      contactPerson: 'Steven Lee',
      created: '2024-01-11 10:30:00',
      updated: '2024-01-19 09:15:00'
    },
    { 
      id: 202, 
      title: 'Cannot logout after login', 
      status: 'In Progress', 
      priority: 'Medium', 
      source: 'mantis',
      description: 'Logout functionality fails to clear session data properly, keeping users logged in.',
      assignee: 'Thomas Anderson',
      contactPerson: 'Maria Garcia',
      created: '2024-01-13 14:20:00',
      updated: '2024-01-20 11:40:00'
    },
    { 
      id: 203, 
      title: 'Login test cases failing', 
      status: 'Open', 
      priority: 'High', 
      source: 'mantis',
      description: 'Automated test suite for login functionality showing failures across multiple scenarios.',
      assignee: 'Nicole Parker',
      contactPerson: 'James Wilson',
      created: '2024-01-15 16:10:00',
      updated: '2024-01-21 13:25:00'
    },
    { 
      id: 204, 
      title: 'Wrong credentials not handled', 
      status: 'Open', 
      priority: 'Medium', 
      source: 'mantis',
      description: 'Application does not properly handle and display errors for incorrect login credentials.',
      assignee: 'Daniel Martinez',
      contactPerson: 'Susan Clark',
      created: '2024-01-17 12:45:00',
      updated: '2024-01-22 08:50:00'
    },
    { 
      id: 205, 
      title: 'JS error on login screen', 
      status: 'Resolved', 
      priority: 'Low', 
      source: 'mantis',
      description: 'JavaScript console errors appearing on login page causing minor UI glitches.',
      assignee: 'Laura Young',
      contactPerson: 'Mark Johnson',
      closedBy: 'Catherine Smith',
      created: '2024-01-09 07:30:00',
      updated: '2024-01-23 15:20:00',
      resolution: 'Fixed JavaScript syntax error in login validation script'
    }
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
      if (issue) {
        setSelectedIssueDetails(issue);
        setShowDetailedView(true);
        setAccuracyScore('');
      }
    }
  };

  const handleBackToSelection = () => {
    setShowDetailedView(false);
    setSelectedIssueDetails(null);
    setAccuracyScore('');
  };

  const handleViewFixDetails = () => {
    alert(`Viewing Fix Details for ${selectedIssueDetails?.source.toUpperCase()} Issue #${selectedIssueDetails?.id}\n\nFix Details:\n- Updated authentication middleware\n- Added proper error handling\n- Fixed session management\n- Deployed hotfix version 2.1.3`);
  };

  const handleViewRCADetails = () => {
    alert(`Viewing RCA Details for ${selectedIssueDetails?.source.toUpperCase()} Issue #${selectedIssueDetails?.id}\n\nRoot Cause Analysis:\n- Issue caused by outdated session validation\n- Missing error handling in auth module\n- Race condition in login process\n- Affected users: 15% of daily active users`);
  };

  const handleViewSVNDetails = () => {
    alert(`Viewing SVN Details for ${selectedIssueDetails?.source.toUpperCase()} Issue #${selectedIssueDetails?.id}\n\nSVN Information:\n- Commit: r4521\n- Author: ${selectedIssueDetails?.assignee}\n- Date: 2024-01-22 14:30:00\n- Files modified: auth.js, session.js, login.html\n- Branch: hotfix/login-fixes`);
  };

  const handleAccuracyScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers 1-10
    if (value === '' || (/^[1-9]$/.test(value) || value === '10')) {
      setAccuracyScore(value);
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

        {/* Detailed Issue View */}
        {showDetailedView && selectedIssueDetails && (
          <Card className="p-6 shadow-lg border-2 border-green-100 bg-white" data-testid="card-detailed-view">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBackToSelection}
                    variant="outline"
                    size="sm"
                    data-testid="button-back"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Selection
                  </Button>
                  <Badge 
                    variant="secondary" 
                    className={`${selectedIssueDetails.source === 'redmine' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                  >
                    {selectedIssueDetails.source.toUpperCase()}
                  </Badge>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedIssueDetails.status)} data-testid="badge-detailed-status">
                  {selectedIssueDetails.status}
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4" data-testid="text-detailed-title">
                #{selectedIssueDetails.id}: {selectedIssueDetails.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 space-y-6">
              {/* Issue Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed" data-testid="text-detailed-description">
                  {selectedIssueDetails.description}
                </p>
              </div>

              {/* Issue Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Assignee
                    </h4>
                    <p className="text-gray-900" data-testid="text-detailed-assignee">
                      {selectedIssueDetails.assignee}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Priority</h4>
                    <Badge variant={getPriorityBadgeVariant(selectedIssueDetails.priority)} data-testid="badge-detailed-priority">
                      {selectedIssueDetails.priority}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Contact Person
                      {selectedIssueDetails.status === 'Resolved' && selectedIssueDetails.closedBy && (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-2 cursor-help">
                              ℹ️
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Closed by: {selectedIssueDetails.closedBy}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </h4>
                    <p className="text-gray-900" data-testid="text-contact-person">
                      {selectedIssueDetails.contactPerson}
                    </p>
                  </div>

                  {selectedIssueDetails.resolution && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Resolution</h4>
                      <p className="text-gray-700 text-sm" data-testid="text-resolution">
                        {selectedIssueDetails.resolution}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created
                    </h4>
                    <p className="text-gray-700 text-sm" data-testid="text-detailed-created">
                      {selectedIssueDetails.created}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Last Updated
                    </h4>
                    <p className="text-gray-700 text-sm" data-testid="text-detailed-updated">
                      {selectedIssueDetails.updated}
                    </p>
                  </div>
                </div>
              </div>

              {/* Accuracy Score Input */}
              <div className="border-t pt-6">
                <div className="max-w-md">
                  <Label htmlFor="accuracy-score" className="block text-sm font-medium text-gray-700 mb-2">
                    Accuracy Score (1-10)
                  </Label>
                  <Input
                    id="accuracy-score"
                    data-testid="input-accuracy-score"
                    value={accuracyScore}
                    onChange={handleAccuracyScoreChange}
                    placeholder="Rate the similarity (1-10)"
                    className="w-full"
                    maxLength={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rate how similar this issue is to your original issue (1 = not similar, 10 = identical)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleViewFixDetails}
                    data-testid="button-view-fix"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <Eye className="w-4 h-4" />
                    View Fix Details
                  </Button>
                  
                  <Button
                    onClick={handleViewRCADetails}
                    data-testid="button-view-rca"
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
                  >
                    <Search className="w-4 h-4" />
                    View RCA Details
                  </Button>
                  
                  <Button
                    onClick={handleViewSVNDetails}
                    data-testid="button-view-svn"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    <GitBranch className="w-4 h-4" />
                    View SVN Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Similar Issues with Radio Selection */}
        {showSimilar && similarIssues.length > 0 && !showDetailedView && (
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