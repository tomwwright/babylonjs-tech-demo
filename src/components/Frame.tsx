import React from "react";

export const Frame = ({ children }: React.PropsWithChildren) => (
  <div
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      pointerEvents: "none",
    }}
  >
    {children}
  </div>
);

export const Header = ({ children }: React.PropsWithChildren) => (
  <div
    id="header"
    style={{
      height: "50px",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      padding: "4px 16px",
      alignContent: "center",
      pointerEvents: "auto",
    }}
  >
    {children}
  </div>
);

export const SidebarContainer = ({ children }: React.PropsWithChildren) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "stretch",
      flex: "auto",
    }}
  >
    {children}
  </div>
);

export const Sidebar = ({ children }: React.PropsWithChildren) => (
  <div
    style={{
      width: "140px",
      pointerEvents: "none",
      padding: "8px 8px",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
    }}
  >
    {children}
  </div>
);

export const Footer = ({ children }: React.PropsWithChildren) => (
  <div
    id="footer"
    style={{
      height: "50px",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      padding: "4px 16px",
      alignContent: "center",
    }}
  >
    {children}
  </div>
);
