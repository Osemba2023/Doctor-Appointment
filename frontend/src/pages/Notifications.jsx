import React, { useEffect } from 'react';
import { Tabs, Layout } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { setUser } from '../redux/userSlice';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { socket } from '../socket';

const { TabPane } = Tabs;
const { Content } = Layout;

function Notifications() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ------------------------------
  // Real-time notifications
  // ------------------------------
  useEffect(() => {
    if (user?._id) {
      // Join user-specific room on server
      socket.emit("join-user-room", user._id);

      // Listen for incoming notifications
      const handleNotification = (notification) => {
        toast.success(notification.message);

        // Update Redux store to show new notification
        dispatch(setUser({
          ...user,
          unseenNotifications: [notification, ...(user.unseenNotifications || [])],
        }));
      };

      socket.on("receive-notification", handleNotification);

      // Cleanup on unmount
      return () => {
        socket.off("receive-notification", handleNotification);
      };
    }
  }, [user, dispatch]);

  // ------------------------------
  // Mark all notifications as seen
  // ------------------------------
  const markAllAsSeen = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post("/api/user/mark-all-notifications-as-seen", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      dispatch(hideLoading());

      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setUser(res.data.data));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Error marking notifications as seen.");
      console.error(error);
    }
  };

  // ------------------------------
  // Delete all seen notifications
  // ------------------------------
  const deleteAllSeen = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post("/api/user/delete-all-notifications", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      dispatch(hideLoading());

      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setUser(res.data.data));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Error deleting notifications.");
      console.error(error);
    }
  };

  return (
    <Content>
      <h1 className='page-title'>Notifications</h1>
      <Tabs defaultActiveKey='1'>
        {/* UNSEEN */}
        <TabPane tab='Unseen' key='1'>
          <div className='d-flex justify-content-end'>
            <h1 className='anchor' onClick={markAllAsSeen}>Mark all as Seen</h1>
          </div>
          {user?.unseenNotifications?.map((n, i) => (
            <div
              key={i}
              className='card p-2 mt-2 cursor-pointer'
              onClick={() => navigate(n.onClickPath)}
            >
              <div className='card-text'>{n.message}</div>
            </div>
          ))}
        </TabPane>

        {/* SEEN */}
        <TabPane tab='Seen' key='2'>
          <div className='d-flex justify-content-end'>
            <h1 className='anchor' onClick={deleteAllSeen}>Delete all</h1>
          </div>
          {user?.seenNotifications?.map((n, i) => (
            <div
              key={i}
              className='card p-2 mt-2 cursor-pointer'
              onClick={() => navigate(n.onClickPath)}
            >
              <div className='card-text'>{n.message}</div>
            </div>
          ))}
        </TabPane>
      </Tabs>
    </Content>
  );
}

export default Notifications;









