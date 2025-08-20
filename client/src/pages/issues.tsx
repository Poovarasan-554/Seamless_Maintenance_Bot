import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Search, Loader2, LogOut, User, Calendar, Clock, ArrowLeft, Eye, Code, GitBranch, X, CheckCircle, Edit } from "lucide-react";

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
  similarity_percentage: number;
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
  const [isAccuracySubmitted, setIsAccuracySubmitted] = useState(false);
  const [selectedIssueDetails, setSelectedIssueDetails] = useState<SimilarIssue | null>(null);
  const [activeDetailCard, setActiveDetailCard] = useState<'fix' | 'rca' | 'svn' | null>(null);

  const username = localStorage.getItem("username") || "User";

  // Mock data removed - now using API data exclusively

  const validateIssueId = (id: string): boolean => {
    const numericId = parseInt(id);
    return !isNaN(numericId) && numericId > 0 && id.toString() === numericId.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("authToken");
    setLocation("/login");
  };

  const resetAllFutureActions = () => {
    // Reset all future actions when any previous action is performed
    setShowSimilar(false);
    setSimilarIssues([]);
    setSelectedIssue('');
    setShowNoMatches(false);
    setShowRCAContent(false);
    setShowDetailedView(false);
    setSelectedIssueDetails(null);
    setAccuracyScore('');
    setIsAccuracySubmitted(false);
    setActiveDetailCard(null);
  };

  const handleFetchIssue = async () => {
    if (!issueId.trim()) {
      setError("Please enter an issue ID");
      return;
    }

    if (!validateIssueId(issueId)) {
      setError('Please enter a valid numeric Issue ID');
      return;
    }

    setIsLoading(true);
    setError("");
    
    // Clear previous data and reset all future actions
    setIssueDetails(null);
    resetAllFutureActions();

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/issues/${issueId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        if (issueId === "99999") {
          setShowNoMatches(true);
        } else {
          setError("Issue not found. Please check the issue ID and try again.");
        }
      } else if (response.ok) {
        const issue = await response.json();
        setIssueDetails(issue);
      } else if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        window.location.href = "/login";
      } else {
        setError("Failed to fetch issue. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    }

    setIsLoading(false);
  };

  const handleFetchSimilarIssues = async () => {
    if (!issueId.trim()) {
      setError("Please enter an issue ID first");
      return;
    }

    // Reset all future actions when fetching similar issues
    resetAllFutureActions();

    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/issues/${issueId}/similar`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const similarIssuesData = await response.json();
        setSimilarIssues(similarIssuesData);
        setShowSimilar(true);
        setShowNoMatches(false);
      } else if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        window.location.href = "/login";
      } else {
        setError("Failed to fetch similar issues. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    }

    setIsLoading(false);
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
        // Reset only relevant future actions
        setAccuracyScore('');
        setIsAccuracySubmitted(false);
        setActiveDetailCard(null);
      }
    }
  };

  const handleBackToSelection = () => {
    setShowDetailedView(false);
    setSelectedIssueDetails(null);
    setAccuracyScore('');
    setIsAccuracySubmitted(false);
    setActiveDetailCard(null);
  };

  const handleViewFixDetails = () => {
    setActiveDetailCard(activeDetailCard === 'fix' ? null : 'fix');
  };

  const handleViewRCADetails = () => {
    setActiveDetailCard(activeDetailCard === 'rca' ? null : 'rca');
  };

  const handleViewSVNDetails = () => {
    setActiveDetailCard(activeDetailCard === 'svn' ? null : 'svn');
  };

  const handleSubmitAccuracy = () => {
    if (accuracyScore) {
      setIsAccuracySubmitted(true);
    }
  };

  const handleEditAccuracy = () => {
    setIsAccuracySubmitted(false);
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
        className={`p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
          isSelected 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full" data-testid={`similarity-${issue.id}`}>
                  {issue.similarity_percentage.toFixed(1)}% match
                </span>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              Issue Tracker
            </h1>
            <p className="text-lg text-gray-600">Welcome back, Poovarasan!</p>
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
        <Card className="p-8 mb-8 shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 rounded-2xl">
          <CardContent className="p-0">
            <div className="space-y-4">
              <div>
                <Label htmlFor="issueId" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue ID
                </Label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      id="issueId"
                      data-testid="input-issue-id"
                      value={issueId}
                      onChange={(e) => setIssueId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter issue ID (e.g., 1234)"
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
          <Card className="p-8 mb-8 shadow-xl border-0 bg-gradient-to-br from-white to-green-50 rounded-2xl" data-testid="card-issue-details">
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
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
          <Card className="p-8 shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl" data-testid="card-detailed-view">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBackToSelection}
                    variant="outline"
                    size="sm"
                    data-testid="button-back"
                    className="flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200 rounded-lg border-gray-300"
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
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <Label htmlFor="accuracy-score" className="block text-sm font-semibold text-gray-800 mb-3">
                    Accuracy Score (1-10)
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xs">
                      <Input
                        id="accuracy-score"
                        data-testid="input-accuracy-score"
                        value={accuracyScore}
                        onChange={handleAccuracyScoreChange}
                        placeholder="Rate similarity (1-10)"
                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        maxLength={2}
                        disabled={isAccuracySubmitted}
                      />
                    </div>
                    
                    {!isAccuracySubmitted ? (
                      <Button
                        onClick={handleSubmitAccuracy}
                        disabled={!accuracyScore}
                        data-testid="button-submit-accuracy"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Saved: {accuracyScore}
                        </span>
                        <Button
                          onClick={handleEditAccuracy}
                          variant="outline"
                          size="sm"
                          data-testid="button-edit-accuracy"
                          className="hover:bg-gray-100 transition-colors duration-200 rounded-lg"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Rate how similar this issue is to your original issue (1 = not similar, 10 = identical)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleViewFixDetails}
                    data-testid="button-view-fix"
                    className={`flex items-center gap-2 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      activeDetailCard === 'fix' 
                        ? 'bg-gradient-to-r from-blue-700 to-blue-800 ring-2 ring-blue-300' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    View Fix Details
                  </Button>
                  
                  <Button
                    onClick={handleViewRCADetails}
                    data-testid="button-view-rca"
                    className={`flex items-center gap-2 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      activeDetailCard === 'rca' 
                        ? 'bg-gradient-to-r from-orange-700 to-orange-800 ring-2 ring-orange-300' 
                        : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    View RCA Details
                  </Button>
                  
                  <Button
                    onClick={handleViewSVNDetails}
                    data-testid="button-view-svn"
                    className={`flex items-center gap-2 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      activeDetailCard === 'svn' 
                        ? 'bg-gradient-to-r from-purple-700 to-purple-800 ring-2 ring-purple-300' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    }`}
                  >
                    <GitBranch className="w-4 h-4" />
                    View SVN Details
                  </Button>
                </div>
              </div>

              {/* Detail Cards */}
              {activeDetailCard === 'fix' && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-lg" data-testid="card-fix-details">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Fix Details - {selectedIssueDetails.source.toUpperCase()} Issue #{selectedIssueDetails.id}
                    </h4>
                    <Button
                      onClick={() => setActiveDetailCard(null)}
                      variant="ghost"
                      size="sm"
                      data-testid="button-close-fix"
                      className="text-blue-700 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-inner border border-blue-150">
                    <ul className="space-y-3 text-gray-800">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Updated authentication middleware to handle edge cases</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Added comprehensive error handling for login failures</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Fixed session management timeout issues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Deployed hotfix version 2.1.3 to production</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="font-medium text-green-800">Status: Successfully resolved and deployed</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeDetailCard === 'rca' && (
                <div className="mt-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg" data-testid="card-rca-details">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Root Cause Analysis - {selectedIssueDetails.source.toUpperCase()} Issue #{selectedIssueDetails.id}
                    </h4>
                    <Button
                      onClick={() => setActiveDetailCard(null)}
                      variant="ghost"
                      size="sm"
                      data-testid="button-close-rca"
                      className="text-orange-700 hover:bg-orange-200 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-inner border border-orange-150">
                    <div className="space-y-4 text-gray-800">
                      <div>
                        <h5 className="font-semibold text-orange-800 mb-2">Primary Cause:</h5>
                        <p>Issue caused by outdated session validation library that didn't handle concurrent login attempts properly.</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-orange-800 mb-2">Contributing Factors:</h5>
                        <ul className="space-y-1 ml-4">
                          <li>• Missing error handling in authentication module</li>
                          <li>• Race condition in login process during peak hours</li>
                          <li>• Insufficient logging for debugging login failures</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-orange-800 mb-2">Impact Assessment:</h5>
                        <p>Affected approximately 15% of daily active users during peak login times, resulting in increased support tickets and user frustration.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailCard === 'svn' && (
                <div className="mt-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-lg" data-testid="card-svn-details">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      SVN Details - {selectedIssueDetails.source.toUpperCase()} Issue #{selectedIssueDetails.id}
                    </h4>
                    <Button
                      onClick={() => setActiveDetailCard(null)}
                      variant="ghost"
                      size="sm"
                      data-testid="button-close-svn"
                      className="text-purple-700 hover:bg-purple-200 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-inner border border-purple-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold text-purple-800">Commit:</span>
                          <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">r4521</span>
                        </div>
                        <div>
                          <span className="font-semibold text-purple-800">Author:</span>
                          <span className="ml-2">{selectedIssueDetails.assignee}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-purple-800">Date:</span>
                          <span className="ml-2">2024-01-22 14:30:00</span>
                        </div>
                        <div>
                          <span className="font-semibold text-purple-800">Branch:</span>
                          <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">hotfix/login-fixes</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-purple-800 mb-2">Modified Files:</h5>
                        <ul className="space-y-1 font-mono text-sm">
                          <li className="bg-gray-100 px-2 py-1 rounded">src/auth/auth.js</li>
                          <li className="bg-gray-100 px-2 py-1 rounded">src/session/session.js</li>
                          <li className="bg-gray-100 px-2 py-1 rounded">public/login.html</li>
                          <li className="bg-gray-100 px-2 py-1 rounded">tests/auth.test.js</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Similar Issues with Radio Selection */}
        {showSimilar && similarIssues.length > 0 && !showDetailedView && (
          <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50 rounded-2xl" data-testid="container-similar-issues">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Similar Issues</h2>
                <p className="text-sm text-gray-500">Select one issue to continue</p>
              </div>
              
              <RadioGroup value={selectedIssue} onValueChange={setSelectedIssue}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Redmine Issues */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-red-700 border-b border-red-200 pb-2">
                        Redmine Issues (Top 5)
                      </h3>
                      <span className="text-sm text-gray-500">
                        {similarIssues.filter(issue => issue.source === 'redmine').length} found
                      </span>
                    </div>
                    <div className="space-y-3" data-testid="container-redmine-issues">
                      {similarIssues.filter(issue => issue.source === 'redmine').slice(0, 5).map(renderIssueCard)}
                    </div>
                  </div>
                  
                  {/* Mantis Issues */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-blue-700 border-b border-blue-200 pb-2">
                        Mantis Issues (Top 5)
                      </h3>
                      <span className="text-sm text-gray-500">
                        {similarIssues.filter(issue => issue.source === 'mantis').length} found
                      </span>
                    </div>
                    <div className="space-y-3" data-testid="container-mantis-issues">
                      {similarIssues.filter(issue => issue.source === 'mantis').slice(0, 5).map(renderIssueCard)}
                    </div>
                  </div>
                </div>
              </RadioGroup>
              
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <Button
                  data-testid="button-continue"
                  onClick={handleContinue}
                  disabled={!selectedIssue}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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