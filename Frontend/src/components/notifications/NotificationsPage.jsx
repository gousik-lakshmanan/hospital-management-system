import React, { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { Bell, ShieldAlert, CheckCircle, Info, CheckCheck } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useContext(NotificationContext);

  const getIcon = (type) => {
    switch (type) {
      case 'Emergency': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Appointment': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'Pharmacy': return <Info className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Hospital Log alerts</h2>
          <p className="text-xs text-slate-500">Real-time clinical alerts, logistics updates, and system notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllAsRead}>
            Mark All Read
          </Button>
        )}
      </div>

      <Card title="System Announcements & Logs" subtitle={`${unreadCount} unread system alerts remaining`}>
        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No notifications on record.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`py-4 px-3 flex gap-4 items-start hover:bg-slate-50 cursor-pointer transition-colors ${
                  n.unread ? 'bg-blue-50/10' : ''
                }`}
              >
                <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                      {n.title}
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block" />}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{n.description}</p>
                  <div className="pt-1.5">
                    <Badge>{n.type}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
