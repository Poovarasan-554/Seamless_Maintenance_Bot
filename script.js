import React, { useState } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0';

// Mock data
const mockRedmineIssues = [
  { id: 101, title: 'Login fails', status: 'Open', priority: 'High', source: 'redmine' },
  { id: 102, title: 'Session timeout too fast', status: 'In Progress', priority: 'Medium', source: 'redmine' },
  { id: 103, title: 'Login button not working', status: 'Open', priority: 'High', source: 'redmine' },
  { id: 104, title: 'Incorrect error on login', status: 'Open', priority: 'Medium', source: 'redmine' },
  { id: 105, title: 'UI freeze on login', status: 'Resolved', priority: 'Low', source: 'redmine' }
];

const mockMantisIssues = [
  { id: 201, title: 'Login redirect broken', status: 'Open', priority: 'High', source: 'mantis' },
  { id: 202, title: 'Cannot logout after login', status: 'In Progress', priority: 'Medium', source: 'mantis' },
  { id: 203, title: 'Login test cases failing', status: 'Open', priority: 'High', source: 'mantis' },
  { id: 204, title: 'Wrong credentials not handled', status: 'Open', priority: 'Medium', source: 'mantis' },
  { id: 205, title: 'JS error on login screen', status: 'Resolved', priority: 'Low', source: 'mantis' }
];

function App() {
  const [issueId, setIssueId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [issueDetails, setIssueDetails] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [showNoMatches, setShowNoMatches] = useState(false);
  const [showRCAContent, setShowRCAContent] = useState(false);
  const [selectedRedmineIssues, setSelectedRedmineIssues] = useState([]);
  const [selectedMantisIssues, setSelectedMantisIssues] = useState([]);
  const [activeDetailSection, setActiveDetailSection] = useState(null);

  const validateIssueId = (id) => {
    const numericId = parseInt(id);
    return !isNaN(numericId) && numericId > 0 && id.toString() === numericId.toString();
  };

  const handleFetchIssue = () => {
    setError('');
    setIssueDetails(null);
    setShowSimilar(false);
    setShowNoMatches(false);
    setShowRCAContent(false);
    setActiveDetailSection(null);

    if (!issueId.trim()) {
      setError('Issue ID is required');
      return;
    }

    if (!validateIssueId(issueId)) {
      setError('Please enter a valid numeric Issue ID');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const mockData = {
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
    if (parseInt(issueId) === 99999) {
      setShowNoMatches(true);
      setShowSimilar(false);
      setShowRCAContent(false);
    } else {
      setShowSimilar(true);
      setShowNoMatches(false);
    }
    setSelectedRedmineIssues([]);
    setSelectedMantisIssues([]);
    setActiveDetailSection(null);
  };

  const handleFindRCA = () => {
    setShowRCAContent(true);
  };

  const handleRedmineIssueSelection = (issueId, checked) => {
    if (checked) {
      setSelectedRedmineIssues(prev => [...prev, issueId]);
    } else {
      setSelectedRedmineIssues(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleMantisIssueSelection = (issueId, checked) => {
    if (checked) {
      setSelectedMantisIssues(prev => [...prev, issueId]);
    } else {
      setSelectedMantisIssues(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleSelectAllRedmine = (checked) => {
    if (checked) {
      setSelectedRedmineIssues(mockRedmineIssues.map(issue => issue.id));
    } else {
      setSelectedRedmineIssues([]);
    }
  };

  const handleSelectAllMantis = (checked) => {
    if (checked) {
      setSelectedMantisIssues(mockMantisIssues.map(issue => issue.id));
    } else {
      setSelectedMantisIssues([]);
    }
  };

  const handleDetailButtonClick = (detailType) => {
    setActiveDetailSection(activeDetailSection === detailType ? null : detailType);
  };

  const getDetailContent = (detailType) => {
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

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'badge badge-open';
      case 'In Progress':
        return 'badge badge-progress';
      case 'Resolved':
        return 'badge badge-resolved';
      default:
        return 'badge';
    }
  };

  const totalSelectedIssues = selectedRedmineIssues.length + selectedMantisIssues.length;

  return React.createElement('div', { className: 'container' }, [
    // Header
    React.createElement('div', { key: 'header', className: 'header' }, [
      React.createElement('h1', { key: 'title', className: 'main-title' }, [
        React.createElement('span', { key: 'emoji' }, '🔧'),
        'Redmine & Mantis Issue Tracker'
      ]),
      React.createElement('p', { key: 'subtitle', className: 'subtitle' }, 
        'Enter an issue ID to fetch details and discover similar issues across your project management systems'
      )
    ]),

    // Search Form
    React.createElement('div', { key: 'search', className: 'card' }, [
      React.createElement('div', { key: 'search-title', className: 'section-title' }, 'Issue Lookup'),
      React.createElement('div', { key: 'input-group', className: 'input-group' }, [
        React.createElement('div', { key: 'input-container', style: { flex: 1 } }, [
          React.createElement('input', {
            key: 'input',
            className: 'input-field',
            value: issueId,
            onChange: (e) => setIssueId(e.target.value),
            placeholder: 'Enter issue ID (e.g., 1234 or 99999)',
            disabled: isLoading,
            onKeyPress: (e) => e.key === 'Enter' && handleFetchIssue()
          }),
          error && React.createElement('div', { key: 'error', className: 'error' }, [
            React.createElement('span', { key: 'error-icon' }, '⚠️'),
            error
          ])
        ]),
        React.createElement('button', {
          key: 'fetch-btn',
          className: `btn ${isLoading ? 'loading' : ''}`,
          onClick: handleFetchIssue,
          disabled: isLoading
        }, isLoading ? 'Fetching...' : 'Fetch Issue')
      ])
    ]),

    // Issue Details
    issueDetails && React.createElement('div', { key: 'issue-details', className: 'card' }, [
      React.createElement('div', { key: 'details-title', className: 'section-title' }, 'Issue Details'),
      React.createElement('div', { key: 'details-content' }, [
        React.createElement('h3', { key: 'issue-title', className: 'issue-title' }, 
          `#${issueDetails.id}: ${issueDetails.title}`
        ),
        React.createElement('p', { key: 'description', style: { margin: '16px 0', lineHeight: '1.6' } }, 
          issueDetails.description
        ),
        React.createElement('div', { key: 'badges' }, [
          React.createElement('span', { key: 'status', className: getBadgeClass(issueDetails.status) }, 
            issueDetails.status
          ),
          React.createElement('span', { key: 'priority', className: 'badge badge-open' }, 
            issueDetails.priority
          )
        ]),
        React.createElement('div', { key: 'meta', style: { marginTop: '16px', fontSize: '14px', color: '#666' } }, [
          React.createElement('p', { key: 'assignee' }, `Assignee: ${issueDetails.assignee}`),
          React.createElement('p', { key: 'created' }, `Created: ${issueDetails.created}`),
          React.createElement('p', { key: 'updated' }, `Updated: ${issueDetails.updated}`)
        ]),
        React.createElement('button', {
          key: 'similar-btn',
          className: 'btn btn-secondary',
          onClick: handleFetchSimilarIssues,
          style: { marginTop: '24px' }
        }, '🔍 Fetch Similar Issues')
      ])
    ]),

    // No Matches Scenario
    showNoMatches && React.createElement('div', { key: 'no-matches', className: 'card no-matches' }, [
      React.createElement('div', { key: 'no-matches-emoji', className: 'large-emoji' }, '❌'),
      React.createElement('h2', { key: 'no-matches-title' }, 'No Matches Found. Kindly find RCA'),
      React.createElement('button', {
        key: 'rca-btn',
        className: 'btn',
        onClick: handleFindRCA,
        style: { marginTop: '24px' }
      }, '🔍 Find RCA')
    ]),

    // RCA Content
    showRCAContent && React.createElement('div', { key: 'rca-content', className: 'card rca-content' }, [
      React.createElement('div', { key: 'rca-title', className: 'section-title' }, 'Suggested RCA'),
      React.createElement('div', { key: 'rca-text', className: 'detail-content' }, [
        React.createElement('strong', { key: 'rca-label' }, 'Suggested RCA:'),
        React.createElement('br', { key: 'br1' }),
        'Login issue caused by an outdated session token validation library.',
        React.createElement('br', { key: 'br2' }),
        'Issue is reproducible only on legacy builds.'
      ])
    ]),

    // Similar Issues
    showSimilar && React.createElement('div', { key: 'similar-issues', className: 'issue-grid' }, [
      // Redmine Issues
      React.createElement('div', { key: 'redmine', className: 'card redmine-section' }, [
        React.createElement('div', { key: 'redmine-title', className: 'section-title' }, 'Redmine Similar Issues'),
        React.createElement('div', { key: 'redmine-select-all', style: { marginBottom: '16px' } }, [
          React.createElement('input', {
            key: 'redmine-select-all-checkbox',
            type: 'checkbox',
            className: 'checkbox',
            checked: selectedRedmineIssues.length === mockRedmineIssues.length && mockRedmineIssues.length > 0,
            onChange: (e) => handleSelectAllRedmine(e.target.checked)
          }),
          React.createElement('label', { key: 'redmine-select-all-label', style: { marginLeft: '8px' } }, 
            `Select All (${selectedRedmineIssues.length}/${mockRedmineIssues.length})`
          )
        ]),
        ...mockRedmineIssues.map(issue => 
          React.createElement('div', {
            key: `redmine-${issue.id}`,
            className: `issue-item ${selectedRedmineIssues.includes(issue.id) ? 'selected' : ''}`
          }, [
            React.createElement('input', {
              key: 'checkbox',
              type: 'checkbox',
              className: 'checkbox',
              checked: selectedRedmineIssues.includes(issue.id),
              onChange: (e) => handleRedmineIssueSelection(issue.id, e.target.checked)
            }),
            React.createElement('div', { key: 'content', className: 'issue-content' }, [
              React.createElement('div', { key: 'title', className: 'issue-title' }, 
                `#${issue.id}: ${issue.title}`
              ),
              React.createElement('div', { key: 'badges' }, [
                React.createElement('span', { key: 'status', className: getBadgeClass(issue.status) }, 
                  issue.status
                ),
                React.createElement('span', { key: 'priority', className: 'badge badge-open' }, 
                  issue.priority
                )
              ])
            ])
          ])
        )
      ]),

      // Mantis Issues
      React.createElement('div', { key: 'mantis', className: 'card mantis-section' }, [
        React.createElement('div', { key: 'mantis-title', className: 'section-title' }, 'Mantis Similar Issues'),
        React.createElement('div', { key: 'mantis-select-all', style: { marginBottom: '16px' } }, [
          React.createElement('input', {
            key: 'mantis-select-all-checkbox',
            type: 'checkbox',
            className: 'checkbox',
            checked: selectedMantisIssues.length === mockMantisIssues.length && mockMantisIssues.length > 0,
            onChange: (e) => handleSelectAllMantis(e.target.checked)
          }),
          React.createElement('label', { key: 'mantis-select-all-label', style: { marginLeft: '8px' } }, 
            `Select All (${selectedMantisIssues.length}/${mockMantisIssues.length})`
          )
        ]),
        ...mockMantisIssues.map(issue => 
          React.createElement('div', {
            key: `mantis-${issue.id}`,
            className: `issue-item ${selectedMantisIssues.includes(issue.id) ? 'selected' : ''}`
          }, [
            React.createElement('input', {
              key: 'checkbox',
              type: 'checkbox',
              className: 'checkbox',
              checked: selectedMantisIssues.includes(issue.id),
              onChange: (e) => handleMantisIssueSelection(issue.id, e.target.checked)
            }),
            React.createElement('div', { key: 'content', className: 'issue-content' }, [
              React.createElement('div', { key: 'title', className: 'issue-title' }, 
                `#${issue.id}: ${issue.title}`
              ),
              React.createElement('div', { key: 'badges' }, [
                React.createElement('span', { key: 'status', className: getBadgeClass(issue.status) }, 
                  issue.status
                ),
                React.createElement('span', { key: 'priority', className: 'badge badge-open' }, 
                  issue.priority
                )
              ])
            ])
          ])
        )
      ])
    ]),

    // Detail Buttons
    showSimilar && totalSelectedIssues > 0 && React.createElement('div', { key: 'detail-buttons', className: 'card' }, [
      React.createElement('div', { key: 'analysis-title', className: 'section-title' }, 'Issue Analysis Tools'),
      React.createElement('p', { key: 'selected-count', style: { marginBottom: '24px' } }, 
        `Total Selected: ${totalSelectedIssues} issues (Redmine: ${selectedRedmineIssues.length} | Mantis: ${selectedMantisIssues.length})`
      ),
      React.createElement('div', { key: 'buttons', className: 'detail-buttons' }, [
        React.createElement('button', {
          key: 'fix-btn',
          className: `btn ${activeDetailSection === 'fix' ? '' : 'btn-outline'}`,
          onClick: () => handleDetailButtonClick('fix')
        }, '🔧 Fix Details'),
        React.createElement('button', {
          key: 'rca-btn',
          className: `btn ${activeDetailSection === 'rca' ? '' : 'btn-outline'}`,
          onClick: () => handleDetailButtonClick('rca')
        }, '🔍 RCA Details'),
        React.createElement('button', {
          key: 'svn-btn',
          className: `btn ${activeDetailSection === 'svn' ? '' : 'btn-outline'}`,
          onClick: () => handleDetailButtonClick('svn')
        }, '📋 SVN Details')
      ]),
      React.createElement('button', {
        key: 'clear-btn',
        className: 'btn btn-outline',
        onClick: () => {
          setSelectedRedmineIssues([]);
          setSelectedMantisIssues([]);
          setActiveDetailSection(null);
        },
        style: { marginTop: '16px' }
      }, 'Clear All Selections')
    ]),

    // Detail Content
    showSimilar && totalSelectedIssues > 0 && activeDetailSection && React.createElement('div', { key: 'detail-content', className: 'card' }, [
      React.createElement('h3', { key: 'detail-title', className: 'section-title' }, 
        activeDetailSection === 'fix' ? '🔧 Fix Details' :
        activeDetailSection === 'rca' ? '🔍 RCA Details' : '📋 SVN Details'
      ),
      React.createElement('div', { key: 'content', className: 'detail-content' }, 
        getDetailContent(activeDetailSection)
      ),
      React.createElement('button', {
        key: 'close-btn',
        className: 'btn btn-outline',
        onClick: () => setActiveDetailSection(null),
        style: { marginTop: '16px' }
      }, '✕ Close')
    ])
  ]);
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));