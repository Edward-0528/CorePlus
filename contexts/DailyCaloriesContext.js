import React, { createContext, useContext, useState } from 'react';

const DailyCaloriesContext = createContext();

export const DailyCaloriesProvider = ({ children }) => {
  const [dailyCalories, setDailyCalories] = useState(0);
  return (
    <DailyCaloriesContext.Provider value={{ dailyCalories, setDailyCalories }}>
      {children}
    </DailyCaloriesContext.Provider>
  );
};

export const useDailyCalories = () => {
  const context = useContext(DailyCaloriesContext);
  if (context === undefined) {
    throw new Error('useDailyCalories must be used within a DailyCaloriesProvider');
  }
  return context;
};