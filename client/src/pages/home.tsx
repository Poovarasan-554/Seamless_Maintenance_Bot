import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Search, Loader2 } from "lucide-react";
import { stripHtmlTags } from "@/lib/utils";

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

export default function Home() {
  const [issueId, setIssueId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [selectedRedmineIssues, setSelectedRedmineIssues] = useState<number[]>([]);
  const [selectedMantisIssues, setSelectedMantisIssues] = useState<number[]>([]);
  const [activeDetailSection, setActiveDetailSection] = useState<'fix' | 'rca' | 'svn' | null>(null);
  const [showNoMatches, setShowNoMatches] = useState(false);
  const [showRCAContent, setShowRCAContent] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Separate similar issues by source for display
  const redmineIssues = similarIssues.filter(issue => issue.source === 'redmine');
  const mantisIssues = similarIssues.filter(issue => issue.source === 'mantis');

  const validateIssueId = (id: string): boolean => {
    const numericId = parseInt(id);
    return !isNaN(numericId) && numericId > 0 && id.toString() === numericId.toString();
  };

  const handleFetchIssue = async () => {
    setError('');
    setIssueDetails(null);
    setShowSimilar(false);
    setSimilarIssues([]);

    if (!issueId.trim()) {
      setError('Issue ID is required');
      return;
    }

    if (!validateIssueId(issueId)) {
      setError('Please enter a valid numeric Issue ID');
      return;
    }

    setIsLoading(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch('https://maintenancebot-ai.infinitisoftware.net/api/get_issue', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { "Authorization": `Bearer ${authToken}` })
        },
        body: JSON.stringify({ "issue_id": issueId })
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
    if (!issueDetails) {
      setError('Please fetch issue details first');
      return;
    }

    setIsLoadingSimilar(true);

    try {
      // Create query from issue title and description
      const query = `${issueDetails.title} ${issueDetails.description}`;
      
      const authToken = localStorage.getItem("authToken");
      const response = await fetch('https://maintenancebot-ai.infinitisoftware.net/api/ask', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { "Authorization": `Bearer ${authToken}` })
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
              status: 'Open', // Default status since not provided
              priority: 'Medium', // Default priority since not provided
              source: 'redmine' as const
            })),
            ...(similarIssuesData.mantis || []).map((issue: any) => ({
              id: issue.id,
              title: issue.subject,
              status: 'Open', // Default status since not provided
              priority: 'Medium', // Default priority since not provided
              source: 'mantis' as const
            }))
          ];
          
          if (transformedIssues.length > 0) {
            setSimilarIssues(transformedIssues);
            setAiAnalysis(data.reply?.response || '');
            setShowSimilar(true);
            setShowNoMatches(false);
          } else {
            setShowNoMatches(true);
            setShowSimilar(false);
            setShowRCAContent(false);
          }
        } else {
          setShowNoMatches(true);
          setShowSimilar(false);
          setShowRCAContent(false);
        }
      } else if (response.status === 404) {
        setShowNoMatches(true);
        setShowSimilar(false);
        setShowRCAContent(false);
      } else {
        setError("Failed to fetch similar issues. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    }
    
    setSelectedRedmineIssues([]);
    setSelectedMantisIssues([]);
    setActiveDetailSection(null);
    setAiAnalysis('');
    setIsLoadingSimilar(false);
  };

  const handleFindRCA = () => {
    setShowRCAContent(true);
  };

  const handleRedmineIssueSelection = (issueId: number, checked: boolean) => {
    if (checked) {
      setSelectedRedmineIssues(prev => [...prev, issueId]);
    } else {
      setSelectedRedmineIssues(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleMantisIssueSelection = (issueId: number, checked: boolean) => {
    if (checked) {
      setSelectedMantisIssues(prev => [...prev, issueId]);
    } else {
      setSelectedMantisIssues(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleSelectAllRedmine = (checked: boolean) => {
    if (checked) {
      setSelectedRedmineIssues(redmineIssues.map(issue => issue.id));
    } else {
      setSelectedRedmineIssues([]);
    }
  };

  const handleSelectAllMantis = (checked: boolean) => {
    if (checked) {
      setSelectedMantisIssues(mantisIssues.map(issue => issue.id));
    } else {
      setSelectedMantisIssues([]);
    }
  };

  const handleDetailButtonClick = (detailType: 'fix' | 'rca' | 'svn') => {
    setActiveDetailSection(activeDetailSection === detailType ? null : detailType);
  };

  const getDetailContent = (detailType: 'fix' | 'rca' | 'svn') => {
    switch (detailType) {
      case 'fix':
        return "The login issue was fixed by updating the session handler and authentication checks.";
      case 'rca':
        return "Root cause: Missing null check in the login response handler. Impacted legacy login module.";
      case 'svn':
        return "SVN Commit: r1123 by dev_user on 2024-07-20 – Fixed login failure in auth-service.js";
      default:
        return "";
    }
  };

  const totalSelectedIssues = selectedRedmineIssues.length + selectedMantisIssues.length;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      {/* Center Screen Loader Overlay */}
      {isLoadingSimilar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="loader-overlay">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-700 font-medium">Please wait while processing the request...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-3">
            <span className="text-4xl">🔧</span>
            Redmine & Mantis Issue Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Enter an issue ID to fetch details and discover similar issues across your project management systems
          </p>
        </div>

        {/* Enhanced Search Form */}
        <Card className="p-8 mb-8 shadow-lg border-2 border-blue-100 bg-white">
          <CardContent className="p-0">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg inline-block mb-4">
                  Issue Lookup
                </h2>
              </div>
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
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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

        {/* Enhanced Issue Details */}
        {issueDetails && (
          <Card className="p-8 mb-8 shadow-lg border-2 border-green-100 bg-white" data-testid="card-issue-details">
            <CardContent className="p-0">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-lg inline-block">
                  Issue Details
                </h2>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div></div>
                <Badge variant={getStatusBadgeVariant(issueDetails.status)} data-testid="badge-status" className="text-lg px-4 py-2">
                  {issueDetails.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-issue-title">
                      #{issueDetails.id}: {issueDetails.title}
                    </h3>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed" data-testid="text-issue-description">
                      {stripHtmlTags(issueDetails.description)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                      <Badge variant={getPriorityBadgeVariant(issueDetails.priority)} data-testid="badge-priority">
                        {issueDetails.priority}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Assignee</h4>
                      <p className="text-gray-900" data-testid="text-assignee">{issueDetails.assignee}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                      <p className="text-gray-700" data-testid="text-created">{issueDetails.created}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                      <p className="text-gray-700" data-testid="text-updated">{issueDetails.updated}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  data-testid="button-fetch-similar"
                  onClick={handleFetchSimilarIssues}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Fetch Similar Issues
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Matches Scenario */}
        {showNoMatches && (
          <Card className="p-8 mb-8 shadow-lg border-2 border-orange-200 bg-orange-50" data-testid="card-no-matches">
            <CardContent className="p-0">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 rounded-lg inline-block mb-6">
                  No Matches Found
                </h2>
                <div className="text-6xl mb-4">❌</div>
                <p className="text-xl text-gray-700 mb-6 font-medium">
                  No Matches Found. Kindly find RCA
                </p>
                <Button
                  data-testid="button-find-rca"
                  onClick={handleFindRCA}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg"
                >
                  <span className="mr-2">🔍</span>
                  Find RCA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RCA Content */}
        {showRCAContent && (
          <Card className="p-8 mb-8 shadow-lg border-2 border-yellow-200 bg-yellow-50" data-testid="card-rca-content">
            <CardContent className="p-0">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-3 rounded-lg inline-block">
                  Suggested RCA
                </h3>
              </div>
              <div className="bg-white border-2 border-yellow-300 rounded-lg p-6 shadow-inner">
                <p className="text-gray-800 leading-relaxed text-lg">
                  <strong>Suggested RCA:</strong><br/>
                  Login issue caused by an outdated session token validation library.<br/>
                  Issue is reproducible only on legacy builds.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Section */}
        {aiAnalysis && showSimilar && (
          <Card className="p-8 mb-8 shadow-lg border-2 border-purple-100 bg-gradient-to-b from-purple-50 to-white" data-testid="card-ai-analysis">
            <CardContent className="p-0">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 rounded-lg inline-block">
                  🤖 AI Analysis & Recommendations
                </h2>
              </div>
              <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-inner">
                <div className="prose prose-purple max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed" data-testid="text-ai-analysis">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Similar Issues List - Two Sections Side by Side */}
        {showSimilar && similarIssues.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="container-similar-issues">
            {/* Enhanced Redmine Similar Issues */}
            <Card className="p-6 shadow-lg border-2 border-red-100 bg-gradient-to-b from-red-50 to-white" data-testid="card-redmine-issues">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 rounded-lg inline-block">
                    Redmine Similar Issues
                  </h2>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div></div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-redmine"
                      data-testid="checkbox-select-all-redmine"
                      checked={selectedRedmineIssues.length === redmineIssues.length && redmineIssues.length > 0}
                      onCheckedChange={handleSelectAllRedmine}
                    />
                    <Label htmlFor="select-all-redmine" className="text-sm font-medium text-gray-700">
                      Select All ({selectedRedmineIssues.length}/{redmineIssues.length})
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {redmineIssues.map((issue) => (
                    <div key={`redmine-${issue.id}`} className={`border rounded-lg p-3 transition-colors ${
                      selectedRedmineIssues.includes(issue.id) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`} data-testid={`card-redmine-issue-${issue.id}`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`redmine-issue-${issue.id}`}
                          data-testid={`checkbox-redmine-issue-${issue.id}`}
                          checked={selectedRedmineIssues.includes(issue.id)}
                          onCheckedChange={(checked) => handleRedmineIssueSelection(issue.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm" data-testid={`text-redmine-title-${issue.id}`}>
                            #{issue.id}: {issue.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={getStatusBadgeVariant(issue.status)} className="text-xs" data-testid={`badge-redmine-status-${issue.id}`}>
                              {issue.status}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-xs" data-testid={`badge-redmine-priority-${issue.id}`}>
                              {issue.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRedmineIssues.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600" data-testid="text-redmine-selected-count">
                        {selectedRedmineIssues.length} Redmine issue{selectedRedmineIssues.length !== 1 ? 's' : ''} selected
                      </p>
                      <Button variant="outline" size="sm" data-testid="button-clear-redmine-selection" onClick={() => setSelectedRedmineIssues([])}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Mantis Similar Issues */}
            <Card className="p-6 shadow-lg border-2 border-green-100 bg-gradient-to-b from-green-50 to-white" data-testid="card-mantis-issues">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 rounded-lg inline-block">
                    Mantis Similar Issues
                  </h2>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div></div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-mantis"
                      data-testid="checkbox-select-all-mantis"
                      checked={selectedMantisIssues.length === mantisIssues.length && mantisIssues.length > 0}
                      onCheckedChange={handleSelectAllMantis}
                    />
                    <Label htmlFor="select-all-mantis" className="text-sm font-medium text-gray-700">
                      Select All ({selectedMantisIssues.length}/{mantisIssues.length})
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mantisIssues.map((issue) => (
                    <div key={`mantis-${issue.id}`} className={`border rounded-lg p-3 transition-colors ${
                      selectedMantisIssues.includes(issue.id) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`} data-testid={`card-mantis-issue-${issue.id}`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`mantis-issue-${issue.id}`}
                          data-testid={`checkbox-mantis-issue-${issue.id}`}
                          checked={selectedMantisIssues.includes(issue.id)}
                          onCheckedChange={(checked) => handleMantisIssueSelection(issue.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm" data-testid={`text-mantis-title-${issue.id}`}>
                            #{issue.id}: {issue.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={getStatusBadgeVariant(issue.status)} className="text-xs" data-testid={`badge-mantis-status-${issue.id}`}>
                              {issue.status}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-xs" data-testid={`badge-mantis-priority-${issue.id}`}>
                              {issue.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMantisIssues.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600" data-testid="text-mantis-selected-count">
                        {selectedMantisIssues.length} Mantis issue{selectedMantisIssues.length !== 1 ? 's' : ''} selected
                      </p>
                      <Button variant="outline" size="sm" data-testid="button-clear-mantis-selection" onClick={() => setSelectedMantisIssues([])}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Detail Action Buttons */}
        {showSimilar && totalSelectedIssues > 0 && (
          <Card className="p-8 mt-8 shadow-lg border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50" data-testid="card-detail-actions">
            <CardContent className="p-0">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 rounded-lg inline-block">
                  Issue Analysis Tools
                </h2>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white rounded-lg px-4 py-2 border-2 border-purple-200">
                  <p className="text-sm font-medium text-gray-900" data-testid="text-total-selected">
                    Total Selected: {totalSelectedIssues} issues
                  </p>
                  <p className="text-xs text-gray-600">
                    Redmine: {selectedRedmineIssues.length} | Mantis: {selectedMantisIssues.length}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid="button-clear-all-selections" 
                  className="border-2 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setSelectedRedmineIssues([]);
                    setSelectedMantisIssues([]);
                    setActiveDetailSection(null);
                  }}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant={activeDetailSection === 'fix' ? 'default' : 'outline'}
                  size="lg" 
                  data-testid="button-fix-details"
                  className={`px-8 py-3 rounded-lg shadow-md transition-all duration-200 ${
                    activeDetailSection === 'fix' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                      : 'border-2 border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                  onClick={() => handleDetailButtonClick('fix')}
                >
                  🔧 Fix Details
                </Button>
                <Button 
                  variant={activeDetailSection === 'rca' ? 'default' : 'outline'}
                  size="lg" 
                  data-testid="button-rca-details"
                  className={`px-8 py-3 rounded-lg shadow-md transition-all duration-200 ${
                    activeDetailSection === 'rca' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
                      : 'border-2 border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                  onClick={() => handleDetailButtonClick('rca')}
                >
                  🔍 RCA Details
                </Button>
                <Button 
                  variant={activeDetailSection === 'svn' ? 'default' : 'outline'}
                  size="lg" 
                  data-testid="button-svn-details"
                  className={`px-8 py-3 rounded-lg shadow-md transition-all duration-200 ${
                    activeDetailSection === 'svn' 
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white' 
                      : 'border-2 border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                  onClick={() => handleDetailButtonClick('svn')}
                >
                  📋 SVN Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Detail Content Sections */}
        {showSimilar && totalSelectedIssues > 0 && activeDetailSection && (
          <Card className="p-8 mt-6 shadow-lg border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50" data-testid={`card-${activeDetailSection}-content`}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold text-white px-6 py-3 rounded-lg inline-block ${
                  activeDetailSection === 'fix' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                  activeDetailSection === 'rca' ? 'bg-gradient-to-r from-green-600 to-green-700' :
                  'bg-gradient-to-r from-orange-600 to-orange-700'
                }`} data-testid={`title-${activeDetailSection}-details`}>
                  {activeDetailSection === 'fix' && '🔧 Fix Details'}
                  {activeDetailSection === 'rca' && '🔍 RCA Details'}
                  {activeDetailSection === 'svn' && '📋 SVN Details'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid={`button-close-${activeDetailSection}`}
                  className="text-red-600 hover:bg-red-50 border-2 border-red-200 px-3 py-2"
                  onClick={() => setActiveDetailSection(null)}
                >
                  ✕ Close
                </Button>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-inner">
                <p className="text-gray-800 leading-relaxed text-lg font-medium" data-testid={`text-${activeDetailSection}-content`}>
                  {getDetailContent(activeDetailSection)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
