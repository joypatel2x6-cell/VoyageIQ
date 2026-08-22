import React from 'react';
import { useApp } from '../context/AppContext';
import type { CommunityPost } from '../data/mockData';
import { Heart, MessageSquare, Copy, Calendar, DollarSign, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Community: React.FC = () => {
  const { communityPosts, cloneTrip, likeCommunityPost } = useApp();

  const handleClone = (post: CommunityPost) => {
    cloneTrip(post.trip);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Community Itineraries</h1>
          <p>Discover plans from experienced travelers, download, clone, and adapt them to your style.</p>
        </div>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {communityPosts.map((post) => {
          const totalCost = post.trip.destinations.reduce(
            (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
            0
          );

          return (
            <div
              key={post.id}
              className="glass-panel animate-fade-in"
              style={{
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              {/* Header: Author Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{post.authorName}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)' }}>Shared an itinerary</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Body: Trip details */}
              <div
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                {/* Visual Cover */}
                <div
                  style={{
                    width: '180px',
                    height: '120px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={post.trip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800'}
                    alt={post.trip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {post.trip.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {post.trip.description}
                  </p>

                  {/* Highlights Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{post.trip.startDate} to {post.trip.endDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={13} />
                      <span>Budget Spent: ${totalCost.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      <span>{post.trip.destinations.length} Stops</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              {post.trip.destinations.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route:</span>
                  {post.trip.destinations.map((dest, idx) => (
                    <React.Fragment key={dest.id}>
                      {idx > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>→</span>}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {dest.name}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Footer Panel: Stats and CTAs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  borderTop: '1px solid var(--border-color-light)',
                }}
              >
                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={() => likeCommunityPost(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Heart size={16} fill="rgba(239, 68, 68, 0.15)" color="var(--color-error)" />
                    <span>{post.likesCount}</span>
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <MessageSquare size={16} color="var(--text-light)" />
                    <span>{post.commentsCount} comments</span>
                  </div>
                </div>

                {/* Clone Trigger */}
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={() => handleClone(post)}
                >
                  Clone Trip
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
