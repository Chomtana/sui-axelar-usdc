import React, { ReactNode } from 'react';
import { message } from 'antd';

export function AntdAlertProvider({ children }: { children: ReactNode }) {
  const [_, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      {children}
    </>
  )
}