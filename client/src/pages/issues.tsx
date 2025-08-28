import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Search, Loader2, LogOut, User, Calendar, Clock, ArrowLeft, Eye, Code, GitBranch, X, CheckCircle, Edit, ExternalLink } from "lucide-react";

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
  const [issueType, setIssueType] = useState<'redmine' | 'mantis' | 'problem'>('redmine');
  const [issueId, setIssueId] = useState('');
  const [mantisId, setMantisId] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [isLoadingRCA, setIsLoadingRCA] = useState(false);
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
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [selectedSqlIssue, setSelectedSqlIssue] = useState<SimilarIssue | null>(null);

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
    let currentId = '';
    
    if (issueType === 'redmine') {
      if (!issueId.trim()) {
        setError("Please enter a Redmine issue ID");
        return;
      }
      if (!validateIssueId(issueId)) {
        setError('Please enter a valid numeric Redmine Issue ID');
        return;
      }
      currentId = issueId;
    } else if (issueType === 'mantis') {
      if (!mantisId.trim()) {
        setError("Please enter a Mantis issue ID");
        return;
      }
      if (!validateIssueId(mantisId)) {
        setError('Please enter a valid numeric Mantis Issue ID');
        return;
      }
      currentId = mantisId;
    } else {
      setError("Invalid issue type selected");
      return;
    }

    setIsLoading(true);
    setError("");
    
    // Clear previous data and reset all future actions
    setIssueDetails(null);
    resetAllFutureActions();

    try {
      const response = await fetch(`http://localhost/support-ticket-analyzer/redmineData.php?id=${currentId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        setError("Issue not found. Please check the issue ID and try again.");
      } else if (response.ok) {
        const data = await response.json();
        const issue = data.issue;
        // Transform Redmine response to our format
        const transformedIssue = {
          id: issue.id,
          title: issue.subject,
          description: issue.description || 'No description available',
          status: issue.status.name,
          priority: issue.priority.name,
          assignee: issue.assigned_to ? issue.assigned_to.name : 'Unassigned',
          created: issue.created_on,
          updated: issue.updated_on
        };
        setIssueDetails(transformedIssue);
      } else {
        setError("Failed to fetch issue. Please try again.");
      }
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError("Network error. Please check your connection and try again.");
    }

    setIsLoading(false);
  };

  const handleFetchSimilarIssues = async () => {
    let currentId = '';
    
    if (issueType === 'redmine') {
      if (!issueId.trim()) {
        setError("Please enter a Redmine issue ID first");
        return;
      }
      currentId = issueId;
    } else if (issueType === 'mantis') {
      if (!mantisId.trim()) {
        setError("Please enter a Mantis issue ID first");
        return;
      }
      currentId = mantisId;
    } else if (issueType === 'problem') {
      if (!problemStatement.trim()) {
        setError("Please enter a problem statement first");
        return;
      }
      // For problem statements, we'll use a default ID to trigger similar issues
      currentId = '1234';
    }

    // Reset all future actions when fetching similar issues
    resetAllFutureActions();

    setIsLoadingSimilar(true);

    try {
      let query = '';
      if (issueType === 'problem') {
        query = problemStatement.trim();
      } else {
        // First get the issue details to construct the query
        const issueResponse = await fetch(`http://localhost/support-ticket-analyzer/redmineData.php?id=${currentId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (issueResponse.ok) {
          const data = await issueResponse.json();
          const issue = data.issue;
          query = `${issue.subject} ${issue.description || ''}`;
        } else {
          setError("Failed to fetch issue details for similarity search.");
          setIsLoadingSimilar(false);
          return;
        }
      }
      
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      });

      if (response.ok) {
        const data = await response.json();
        const similarIssuesData = data.reply?.similiar_redmine_issues;
        
        if (similarIssuesData) {
          // Transform the response to match our expected format
          const transformedIssues = [
            ...(similarIssuesData.redmine || []).map((issue: any) => ({
              id: issue.id,
              title: issue.subject,
              description: issue.description,
              status: 'Open', // Default status since not provided
              priority: 'Medium', // Default priority since not provided
              assignee: 'Unassigned', // Default assignee since not provided
              source: 'redmine' as const,
              contactPerson: '',
              similarity_percentage: (issue.similarity * 100), // Convert to percentage
              created: '',
              updated: ''
            })),
            ...(similarIssuesData.mantis || []).map((issue: any) => ({
              id: issue.id,
              title: issue.subject,
              description: issue.description,
              status: 'Open', // Default status since not provided
              priority: 'Medium', // Default priority since not provided
              assignee: 'Unassigned', // Default assignee since not provided
              source: 'mantis' as const,
              contactPerson: '',
              similarity_percentage: (issue.similarity * 100), // Convert to percentage
              created: '',
              updated: ''
            }))
          ];
          
          if (transformedIssues.length > 0) {
            setSimilarIssues(transformedIssues);
            setShowSimilar(true);
            setShowNoMatches(false);
          } else {
            setShowNoMatches(true);
            setShowSimilar(false);
          }
        } else {
          setShowNoMatches(true);
          setShowSimilar(false);
        }
      } else if (response.status === 404) {
        // Show "No matches found" when similar issues endpoint returns 404
        setShowNoMatches(true);
        setShowSimilar(false);
      } else {
        setError("Failed to fetch similar issues. Please try again.");
      }
    } catch (err) {
      console.error('Error fetching similar issues:', err);
      setError("Network error. Please check your connection and try again.");
    }

    setIsLoadingSimilar(false);
  };

  const handleFindRCA = async () => {
    setIsLoadingRCA(true);
    // Simulate API call delay for RCA generation
    setTimeout(() => {
      setShowRCAContent(true);
      setIsLoadingRCA(false);
    }, 2000);
  };

  const handleBackFromRCA = () => {
    setShowRCAContent(false);
    setShowNoMatches(false);
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
      if (issueType === 'problem') {
        handleFetchSimilarIssues();
      } else {
        handleFetchIssue();
      }
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

  const handleSqlQueryDetails = (issue: SimilarIssue, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSqlIssue(issue);
    setShowSqlModal(true);
  };

  const handleContinueWithIssue = (issue: SimilarIssue) => {
    setSelectedIssue(issue.id.toString());
    setSelectedIssueDetails(issue);
    setShowDetailedView(true);
    // Reset only relevant future actions
    setAccuracyScore('');
    setIsAccuracySubmitted(false);
    setActiveDetailCard(null);
  };

  const renderIssueCard = (issue: SimilarIssue) => {
    return (
      <div 
        key={issue.id}
        className="p-5 border-2 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
        data-testid={`card-issue-${issue.id}`}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-gray-900" data-testid={`text-issue-title-${issue.id}`}>
                #{issue.id}: {issue.title}
              </h4>
              {issue.description && (
                <p className="text-sm text-gray-600 leading-relaxed" data-testid={`text-issue-description-${issue.id}`}>
                  {issue.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(issue.status)} data-testid={`badge-status-${issue.id}`}>
                  {issue.status}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(issue.priority)} data-testid={`badge-priority-${issue.id}`}>
                  {issue.priority}
                </Badge>
              </div>
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full" data-testid={`similarity-${issue.id}`}>
              {issue.similarity_percentage.toFixed(1)}% match
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {issue.source === 'redmine' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleSqlQueryDetails(issue, e)}
                  data-testid={`button-sql-query-${issue.id}`}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200"
                >
                  <Code className="w-4 h-4 mr-1" />
                  SQL Query Details
                </Button>
              )}
            </div>
            
            <Button
              onClick={() => handleContinueWithIssue(issue)}
              data-testid={`button-continue-${issue.id}`}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Continue with this issue
            </Button>
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

        {/* Issue Type Selection */}
        <Card className="p-8 mb-8 shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 rounded-2xl">
          <CardContent className="p-0">
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Issue Type
                </Label>
                <RadioGroup
                  value={issueType}
                  onValueChange={(value: 'redmine' | 'mantis' | 'problem') => {
                    setIssueType(value);
                    setError('');
                    setIssueDetails(null);
                    resetAllFutureActions();
                  }}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="redmine" id="redmine" data-testid="radio-redmine" />
                    <Label htmlFor="redmine" className="cursor-pointer">Redmine ID</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mantis" id="mantis" data-testid="radio-mantis" />
                    <Label htmlFor="mantis" className="cursor-pointer">Mantis ID</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="problem" id="problem" data-testid="radio-problem" />
                    <Label htmlFor="problem" className="cursor-pointer">Problem Statement</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Redmine ID Input */}
              {issueType === 'redmine' && (
                <div>
                  <Label htmlFor="redmineId" className="block text-sm font-medium text-gray-700 mb-2">
                    Redmine Issue ID
                  </Label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        id="redmineId"
                        data-testid="input-redmine-id"
                        value={issueId}
                        onChange={(e) => setIssueId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter Redmine issue ID (e.g., 1234)"
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
                      data-testid="button-fetch-redmine-issue"
                      onClick={handleFetchIssue}
                      disabled={isLoading || !issueId.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              )}

              {/* Mantis ID Input */}
              {issueType === 'mantis' && (
                <div>
                  <Label htmlFor="mantisId" className="block text-sm font-medium text-gray-700 mb-2">
                    Mantis Issue ID
                  </Label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        id="mantisId"
                        data-testid="input-mantis-id"
                        value={mantisId}
                        onChange={(e) => setMantisId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter Mantis issue ID (e.g., 5678)"
                        disabled={isLoading}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-400"
                      />
                      {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center" data-testid="text-error">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {error}
                        </p>
                      )}
                    </div>
                    <Button
                      data-testid="button-fetch-mantis-issue"
                      onClick={handleFetchIssue}
                      disabled={isLoading || !mantisId.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              )}

              {/* Problem Statement Input */}
              {issueType === 'problem' && (
                <div>
                  <Label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Statement
                  </Label>
                  <div className="space-y-4">
                    <div className="flex-1">
                      <Textarea
                        id="problemStatement"
                        data-testid="input-problem-statement"
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="Describe the problem you're experiencing..."
                        disabled={isLoadingSimilar}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 min-h-[120px] resize-y"
                        rows={4}
                      />
                      {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center" data-testid="text-error">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {error}
                        </p>
                      )}
                    </div>
                    <Button
                      data-testid="button-fetch-similar-from-problem"
                      onClick={handleFetchSimilarIssues}
                      disabled={isLoadingSimilar || !problemStatement.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoadingSimilar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Fetch Similar Issues
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issue Details - Only show for Redmine and Mantis, not for Problem Statement */}
        {issueDetails && issueType !== 'problem' && (
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
                    disabled={isLoadingSimilar}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoadingSimilar ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Fetch Similar Issues
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Matches Scenario */}
        {showNoMatches && (
          <Card className="p-8 mb-8 shadow-2xl border-0 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl animate-in slide-in-from-bottom-4 duration-500" data-testid="card-no-matches">
            <CardContent className="p-0 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="text-3xl">🔍</div>
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                No Matches Found
              </h2>
              <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                No similar issues were found in our database. We recommend performing a Root Cause Analysis to understand this unique issue.
              </p>
              <Button
                data-testid="button-find-rca"
                onClick={handleFindRCA}
                disabled={isLoadingRCA}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoadingRCA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    🔍 Find RCA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RCA Content */}
        {showRCAContent && (
          <Card className="p-8 mb-8 shadow-2xl border-0 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl animate-in slide-in-from-bottom-4 duration-500" data-testid="card-rca-content">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-amber-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    🔬
                  </div>
                  Root Cause Analysis
                </h3>
                <Button
                  onClick={handleBackFromRCA}
                  variant="outline"
                  size="sm"
                  data-testid="button-back-from-rca"
                  className="flex items-center gap-2 hover:bg-amber-100 transition-colors duration-200 rounded-lg border-amber-300 text-amber-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-inner">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2 text-lg">Primary Root Cause:</h4>
                    <p className="text-gray-800 leading-relaxed">
                      Login issue caused by an outdated session token validation library that fails to handle concurrent authentication requests properly.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2 text-lg">Technical Details:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Issue is reproducible only on legacy builds with JWT library version &lt; 2.1.0</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Race condition occurs during peak traffic (&gt;500 concurrent users)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Session timeout configuration conflicts with authentication middleware</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">Recommended Actions:</h4>
                    <p className="text-gray-700">
                      Upgrade authentication library to version 2.3.0+ and implement proper session management with timeout handling.
                    </p>
                  </div>
                </div>
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
                  <a
                    href={selectedIssueDetails.source === 'redmine' 
                      ? `https://redmine.company.com/issues/${selectedIssueDetails.id}`
                      : `https://mantis.company.com/view.php?id=${selectedIssueDetails.id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      selectedIssueDetails.source === 'redmine'
                        ? 'text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50'
                        : 'text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    data-testid={`link-${selectedIssueDetails.source}-${selectedIssueDetails.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    View in {selectedIssueDetails.source === 'redmine' ? 'Redmine' : 'Mantis'}
                  </a>
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
                  {(selectedIssueDetails.status === 'Closed' || selectedIssueDetails.status === 'Resolved') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Contact Person
                      </h4>
                      <p className="text-gray-900" data-testid="text-contact-person">
                        {selectedIssueDetails.closedBy || selectedIssueDetails.contactPerson}
                      </p>
                    </div>
                  )}

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

        {/* Similar Issues with Direct Continue Buttons */}
        {showSimilar && similarIssues.length > 0 && !showDetailedView && (
          <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50 rounded-2xl" data-testid="container-similar-issues">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Similar Issues</h2>
                <p className="text-sm text-gray-500">Click "Continue with this issue" on any issue below</p>
              </div>
              
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
            </CardContent>
          </Card>
        )}

        {/* SQL Query Details Modal */}
        {showSqlModal && selectedSqlIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" data-testid="modal-sql-query">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Code className="w-6 h-6 text-blue-600" />
                    SQL Query Details - Issue #{selectedSqlIssue.id}
                  </h2>
                  <Button
                    onClick={() => {
                      setShowSqlModal(false);
                      setSelectedSqlIssue(null);
                    }}
                    variant="ghost"
                    size="sm"
                    data-testid="button-close-sql-modal"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Issue Summary */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Issue Summary</h3>
                    <p className="text-blue-800">{selectedSqlIssue.title}</p>
                    {selectedSqlIssue.description && (
                      <p className="text-blue-700 text-sm mt-2">{selectedSqlIssue.description}</p>
                    )}
                  </div>
                  
                  {/* SQL Query */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Related SQL Query
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap" data-testid="sql-query-content">
{`SELECT 
    i.issue_id,
    i.title,
    i.description,
    i.status,
    i.priority,
    i.assignee,
    i.created_date,
    i.updated_date,
    p.project_name
FROM issues i
LEFT JOIN projects p ON i.project_id = p.project_id
WHERE i.issue_id = ${selectedSqlIssue.id}
    AND i.status IN ('Open', 'In Progress', 'Resolved')
ORDER BY i.updated_date DESC;`}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Query Explanation */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Query Explanation</h3>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Retrieves detailed information for issue #{selectedSqlIssue.id} from the Redmine database</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Joins with projects table to get associated project information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Filters by active status and orders by last update date</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Includes all relevant fields for comprehensive issue analysis</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Database Schema Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Database Schema Reference</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">issues Table</h4>
                        <ul className="text-sm text-gray-600 space-y-1 font-mono">
                          <li>• issue_id (PRIMARY KEY)</li>
                          <li>• title (VARCHAR)</li>
                          <li>• description (TEXT)</li>
                          <li>• status (ENUM)</li>
                          <li>• priority (ENUM)</li>
                          <li>• assignee (VARCHAR)</li>
                          <li>• project_id (FOREIGN KEY)</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">projects Table</h4>
                        <ul className="text-sm text-gray-600 space-y-1 font-mono">
                          <li>• project_id (PRIMARY KEY)</li>
                          <li>• project_name (VARCHAR)</li>
                          <li>• description (TEXT)</li>
                          <li>• status (ENUM)</li>
                          <li>• created_date (TIMESTAMP)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}