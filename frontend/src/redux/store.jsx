import { configureStore, combineReducers } from '@reduxjs/toolkit';
import alertsReducer from './alertsSlice'; 
import userReducer from './userSlice';

const rootReducer = combineReducers({
    alerts: alertsReducer,
    user: userReducer,
});

const store = configureStore({
    reducer: rootReducer,
});

export default store;
