import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export default function Home() {
  const [issueId, setIssueId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);

  // Dummy similar issues data
  const mockSimilarIssues: SimilarIssue[] = [
    { id: 1234, title: 'Database connection timeout in production environment', status: 'Open', priority: 'High' },
    { id: 1235, title: 'User authentication fails on mobile devices', status: 'In Progress', priority: 'Medium' },
    { id: 1236, title: 'Performance issues with large dataset queries', status: 'Open', priority: 'High' },
    { id: 1237, title: 'Cache invalidation not working properly', status: 'Resolved', priority: 'Low' },
    { id: 1238, title: 'Email notifications delayed during peak hours', status: 'Open', priority: 'Medium' }
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
    setSimilarIssues(mockSimilarIssues);
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

        {/* Similar Issues List */}
        {showSimilar && similarIssues.length > 0 && (
          <Card className="p-8" data-testid="card-similar-issues">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Similar Issues</h2>
              
              <div className="space-y-4">
                {similarIssues.map((issue) => (
                  <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors" data-testid={`card-similar-issue-${issue.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1" data-testid={`text-similar-title-${issue.id}`}>
                          #{issue.id}: {issue.title}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <Badge variant={getStatusBadgeVariant(issue.status)} data-testid={`badge-similar-status-${issue.id}`}>
                            {issue.status}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(issue.priority)} data-testid={`badge-similar-priority-${issue.id}`}>
                            {issue.priority}
                          </Badge>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
