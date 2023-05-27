import {
  Field,
  Focusable,
  ButtonItem,
  definePlugin,
  DialogButton,
  Menu,
  MenuItem,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  showContextMenu,
  staticClasses,
} from "decky-frontend-lib";

import { VFC, ReactNode } from "react";
import { BsTerminalFill, BsLightningFill, BsGrid3X3GapFill } from "react-icons/bs";

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  const spawnProcess = async (cmd) => {
    const result = await serverAPI.callPluginMethod("launch", { "cmd": cmd });
    if (result.success) {
      serverAPI.toaster.toast({
          "title": "Executed " + (result.result.retcode == 0 ? "successfully" : "with error " + result.result.retcode),
          "body": (result.result.stdout + " " + result.result.stderr)
      });
    }
  };

  const LaunchMenu : VFC<{name : string, cmd : string}> = ({name, cmd}) => {
      return (<MenuItem onSelected={async () => {await spawnProcess(cmd);}}>{name}</MenuItem>);
  }

  const LaunchRow : VFC<{name : string, cmd : string, children?: ReactNode}> = ({name, cmd, children}) => {
    const showCtxMenu = (e: MouseEvent | GamepadEvent) => {
      showContextMenu(
        <Menu label={name}>
          {children}
        </Menu>,
        e.currentTarget ?? window,
      );
    };

    const button_style = {
      minHeight: "35px",
      minWidth: "40px",
      maxWidth: "40px",
      paddingLeft: "0px",
      paddingRight: "0px",
      justifyContent: "center",
      alignItems: "center"
    };

    const margin_right_style = {
      marginRight: "2px",
    };

    return (
      <Field label={name}>
        <Focusable style={{display: 'flex', flexDirection: 'row', paddingLeft: "10px", paddingRight: "10px"}}>
          <DialogButton
            style={{...button_style, ...margin_right_style}}
            onClick={async() => {await spawnProcess(cmd);}}>
            <BsLightningFill/>
          </DialogButton>
          <DialogButton
            style={button_style}
            onClick={(e) => { showCtxMenu(e); }}>
            <BsGrid3X3GapFill/>
          </DialogButton>
        </Focusable>
      </Field>
    );
  };

  return (
    <PanelSection title="Services">
      <LaunchRow name="Leaf" cmd="/home/deck/Dotfiles/deck/leaf.sh start">
        <LaunchMenu name="Status" cmd="/home/deck/Dotfiles/deck/leaf.sh"/>
        <LaunchMenu name="Start Global" cmd="/home/deck/Dotfiles/deck/leaf.sh start global"/>
        <LaunchMenu name="Stop" cmd="/home/deck/Dotfiles/deck/leaf.sh stop"/>
      </LaunchRow>
      <LaunchRow name="Auto Brightness" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user restart auto_brightness">
        <LaunchMenu name="Status" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user is-active auto_brightness"/>
        <LaunchMenu name="Stop" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user stop auto_brightness"/>
      </LaunchRow>
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Launcher</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <BsTerminalFill />,
    onDismount() {},
  };
});
