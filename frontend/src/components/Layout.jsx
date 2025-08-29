import React, { useState } from 'react';
import '../layout.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Badge, Tag } from 'antd';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const userMenu = [
    { name: 'Home', path: '/', icon: 'ri-home-line' },
    { name: 'Appointments', path: '/appointments', icon: 'ri-calendar-line' },
    { name: 'Apply Doctor', path: '/apply-doctor', icon: 'ri-hospital-line' },
    { name: 'Profile', path: '/profile', icon: 'ri-user-line' }
  ];

  const adminMenu = [
    { name: 'Home', path: '/', icon: 'ri-home-line' },
    { name: 'Users', path: '/users', icon: 'ri-user-line' },
    { name: 'Doctors', path: '/doctors', icon: 'ri-user-add-fill' },
    { name: 'Profile', path: `/profile/${user?._id}`, icon: 'ri-user-line' }
  ];

  const doctorMenu = [
    { name: 'Home', path: '/', icon: 'ri-home-line' },
    { name: 'Appointments', path: '/doctor/appointments', icon: 'ri-calendar-line' },
    { name: 'Profile', path: `/profile/${user?._id}`, icon: 'ri-user-line' }
  ];

  // 👇 Select correct menu based on user role
  const menuToBeRendered =
    user?.role === 'admin' ? adminMenu :
      user?.role === 'doctor' ? doctorMenu :
        userMenu;

  return (
    <div className='main'>
      <div className='d-flex layout'>
        <div className={`sidebar ${collapsed ? 'collapsed-sidebar' : ''}`}>
          <div className='sidebar-header'>
            {collapsed ? (
              <h1 className='logo'>SH</h1>
            ) : (
              <>
                <h1>Smart Health</h1>
                <div className='user-profile-summary' onClick={() => navigate(`/profile/${user?._id}`)}>
                  <i className='ri-user-line user-icon'></i>
                  <div className='user-name'>{user?.name}</div>
                  <Tag color={
                    user?.role === 'admin' ? 'volcano' :
                      user?.role === 'doctor' ? 'geekblue' : 'green'
                  }>
                    {user?.role?.toUpperCase()}
                  </Tag>
                </div>
              </>
            )}
          </div>

          <div className='menu'>
            {menuToBeRendered.map((menu, index) => (
              <div
                key={index}
                className={`menu-item ${location.pathname === menu.path ? 'active-menu-item' : ''}`}
              >
                <Link to={menu.path} className="d-flex align-items-center">
                  <i className={menu.icon}></i>
                  {!collapsed && <span>{menu.name}</span>}
                </Link>
              </div>
            ))}

            <div
              className="menu-item logout-item"
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
            >
              <i className="ri-logout-circle-line"></i>
              {!collapsed && <span>Logout</span>}
            </div>
          </div>
        </div>

        <div className='content'>
          <div className='header'>
            <i
              className={`ri-${collapsed ? 'menu' : 'close'}-line close-items`}
              onClick={() => setCollapsed(!collapsed)}
            ></i>

            <div className='d-flex align-items-center px-4'>
              <Badge
                count={user?.unseenNotifications?.length || 0}
                onClick={() => navigate('/notifications')}
              >
                <i className="ri-notification-line layout-action-item px-3"></i>
              </Badge>

              <Link to={user?.role === 'user' ? '/profile' : `/profile/${user?._id}`}>
                {user?.name}
              </Link>
            </div>
          </div>

          <div className='body'>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;








