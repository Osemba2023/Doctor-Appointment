import React from 'react';
import { Tabs, Layout } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { setUser } from '../redux/userSlice';
import LayoutWrapper from '../components/Layout'; // Your custom layout

const { TabPane } = Tabs;
const { Content } = Layout;

function Notifications() {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Mark all as seen
  const markAllAsSeen = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "/api/user/mark-all-notifications-as-seen",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setUser(res.data.data));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("An error occurred while marking notifications as seen.");
      console.error(error);
    }
  };

  // ✅ Delete all seen
  const deleteAllSeen = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "/api/user/delete-all-notifications",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setUser(res.data.data));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("An error occurred while deleting notifications.");
      console.error(error);
    }
  };

  return (
    <LayoutWrapper>
      <Content>
        <h1 className='page-title'>Notifications</h1>
        <Tabs defaultActiveKey='1'>
          {/* UNSEEN */}
          <TabPane tab='Unseen' key='1'>
            <div className='d-flex justify-content-end'>
              <h1 className='anchor' onClick={markAllAsSeen}>Mark all as Seen</h1>
            </div>
            {user?.unseenNotifications?.map((notification, index) => (
              <div
                className='card p-2 mb-2 cursor-pointer'
                onClick={() => navigate(notification.onClickPath)}
                key={index}
              >
                <div className='card-text'>{notification.message}</div>
              </div>
            ))}
          </TabPane>

          {/* SEEN */}
          <TabPane tab='Seen' key='2'>
            <div className='d-flex justify-content-end'>
              <h1 className='anchor' onClick={deleteAllSeen}>Delete all</h1>
            </div>
            {user?.seenNotifications?.map((notification, index) => (
              <div
                className='card p-2 mb-2 cursor-pointer'
                onClick={() => navigate(notification.onClickPath)}
                key={index}
              >
                <div className='card-text'>{notification.message}</div>
              </div>
            ))}
          </TabPane>
        </Tabs>
      </Content>
    </LayoutWrapper>
  );
}

export default Notifications;






