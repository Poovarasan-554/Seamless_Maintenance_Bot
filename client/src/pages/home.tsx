import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Search, Loader2 } from "lucide-react";

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

  const handleFetchIssue = () => {
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
    setShowSimilar(true);
    setSimilarIssues([...mockRedmineIssues, ...mockMantisIssues]);
    setSelectedRedmineIssues([]);
    setSelectedMantisIssues([]);
    setActiveDetailSection(null);
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
      setSelectedRedmineIssues(mockRedmineIssues.map(issue => issue.id));
    } else {
      setSelectedRedmineIssues([]);
    }
  };

  const handleSelectAllMantis = (checked: boolean) => {
    if (checked) {
      setSelectedMantisIssues(mockMantisIssues.map(issue => issue.id));
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Redmine Issue Tracker</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter an issue ID to fetch details and discover similar issues in your project
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-8 mb-8">
          <CardContent className="p-0">
            <div className="space-y-6">
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
                      className="w-full px-4 py-3"
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
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
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
          <Card className="p-8 mb-8" data-testid="card-issue-details">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Issue Details</h2>
                <Badge variant={getStatusBadgeVariant(issueDetails.status)} data-testid="badge-status">
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
                      {issueDetails.description}
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
                  variant="secondary"
                  className="px-6 py-3"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Fetch Similar Issues
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Similar Issues List - Two Sections Side by Side */}
        {showSimilar && similarIssues.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="container-similar-issues">
            {/* Redmine Similar Issues */}
            <Card className="p-6" data-testid="card-redmine-issues">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Redmine Similar Issues</h2>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-redmine"
                      data-testid="checkbox-select-all-redmine"
                      checked={selectedRedmineIssues.length === mockRedmineIssues.length && mockRedmineIssues.length > 0}
                      onCheckedChange={handleSelectAllRedmine}
                    />
                    <Label htmlFor="select-all-redmine" className="text-sm font-medium text-gray-700">
                      Select All ({selectedRedmineIssues.length}/{mockRedmineIssues.length})
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockRedmineIssues.map((issue) => (
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

            {/* Mantis Similar Issues */}
            <Card className="p-6" data-testid="card-mantis-issues">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Mantis Similar Issues</h2>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-mantis"
                      data-testid="checkbox-select-all-mantis"
                      checked={selectedMantisIssues.length === mockMantisIssues.length && mockMantisIssues.length > 0}
                      onCheckedChange={handleSelectAllMantis}
                    />
                    <Label htmlFor="select-all-mantis" className="text-sm font-medium text-gray-700">
                      Select All ({selectedMantisIssues.length}/{mockMantisIssues.length})
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockMantisIssues.map((issue) => (
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

        {/* Detail Action Buttons */}
        {showSimilar && totalSelectedIssues > 0 && (
          <Card className="p-6 mt-6" data-testid="card-detail-actions">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-total-selected">
                    Total Selected: {totalSelectedIssues} issues
                  </p>
                  <p className="text-xs text-gray-600">
                    Redmine: {selectedRedmineIssues.length} | Mantis: {selectedMantisIssues.length}
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-clear-all-selections" onClick={() => {
                  setSelectedRedmineIssues([]);
                  setSelectedMantisIssues([]);
                  setActiveDetailSection(null);
                }}>
                  Clear All
                </Button>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant={activeDetailSection === 'fix' ? 'default' : 'outline'}
                  size="sm" 
                  data-testid="button-fix-details"
                  onClick={() => handleDetailButtonClick('fix')}
                >
                  Fix Details
                </Button>
                <Button 
                  variant={activeDetailSection === 'rca' ? 'default' : 'outline'}
                  size="sm" 
                  data-testid="button-rca-details"
                  onClick={() => handleDetailButtonClick('rca')}
                >
                  RCA Details
                </Button>
                <Button 
                  variant={activeDetailSection === 'svn' ? 'default' : 'outline'}
                  size="sm" 
                  data-testid="button-svn-details"
                  onClick={() => handleDetailButtonClick('svn')}
                >
                  SVN Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Content Sections */}
        {showSimilar && totalSelectedIssues > 0 && activeDetailSection && (
          <Card className="p-6 mt-4" data-testid={`card-${activeDetailSection}-content`}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900" data-testid={`title-${activeDetailSection}-details`}>
                  {activeDetailSection === 'fix' && 'Fix Details'}
                  {activeDetailSection === 'rca' && 'RCA Details'}
                  {activeDetailSection === 'svn' && 'SVN Details'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid={`button-close-${activeDetailSection}`}
                  onClick={() => setActiveDetailSection(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed" data-testid={`text-${activeDetailSection}-content`}>
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
