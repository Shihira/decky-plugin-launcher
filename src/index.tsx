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

import {
  VFC,
  ReactNode,
  ReactNodeArray,
  ReactElement,
  useState,
  useEffect,
} from "react";
import { BsTerminalFill, BsLightningFill, BsGrid3X3GapFill } from "react-icons/bs";

interface CommandResult {
  retcode: number;
  stdout: string;
  stderr: string;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  const spawnProcess = async (cmd: string, name: string, toasting: boolean = true) => {
    const result = await serverAPI.callPluginMethod("launch", { "cmd": cmd });
    if (result.success) {
      const resultCmd = result.result as CommandResult;
      if (toasting) {
        serverAPI.toaster.toast({
            "title": `Executed ${name} ${resultCmd.retcode == 0 ? "successfully" : "with error " + resultCmd.retcode}`,
            "body": (resultCmd.stdout + " " + resultCmd.stderr)
        });
      }
      return resultCmd;
    }
    return {retcode: -1, stdout: "", stderr: ""};
  };

  const LaunchMenu : VFC<{tag?: string, eq?: string, name: string, cmd: string}> = ({tag, eq, name, cmd}) => {
      return (<MenuItem onSelected={async () => {await spawnProcess(cmd, name);}}>{name}</MenuItem>);
  }

  const LaunchRow : VFC<{name: string, children?: ReactNodeArray}> = ({name, children}) => {
    const [state, setState] = useState({ eq: false });
    const showCtxMenu = (e: MouseEvent | GamepadEvent) => {
      showContextMenu(
        <Menu label={name}>
          {children}
        </Menu>,
        e.currentTarget ?? window,
      );
    };

    var cmdEq: string = "";
    var cmdStart: string = "";
    var cmdStop: string = "";
    var stringEq: string = "";

    if (children) {
      for (var node of children) {
        const elem = node as ReactElement;
        if (elem.props.tag == "start") { cmdStart = elem.props.cmd; }
        if (elem.props.tag == "stop") { cmdStop = elem.props.cmd; }
        if (elem.props.tag == "eq") { cmdEq = elem.props.cmd; stringEq = elem.props.eq; }
      }
    }

    const buttonStyle = {
      minHeight: "35px",
      minWidth: "40px",
      maxWidth: "40px",
      paddingLeft: "0px",
      paddingRight: "0px",
      justifyContent: "center",
      alignItems: "center"
    };

    const queryEqState = async () => {
      if (!stringEq) return;
      const result = await spawnProcess(cmdEq, "Eq", false);
      if (result && result.retcode == 0) {
        const eq = result.stdout.trim() == stringEq;
        setState({eq : eq});
        return eq;
      }
      return false;
    };

    useEffect(() => { queryEqState(); }, [/*execute on load*/]);

    return (
      <Field label={name}>
        <Focusable style={{display: 'flex', flexDirection: 'row', paddingLeft: "10px", paddingRight: "10px"}}>
          <DialogButton
            style={{...buttonStyle, marginRight: "2px"}}
            onClick={state.eq ? () => {spawnProcess(cmdStop, "tag:stop")} : () => {spawnProcess(cmdStart, "tag:start")}}>
            <BsLightningFill color={state.eq ? "green" : ""}/>
          </DialogButton>
          <DialogButton
            style={buttonStyle}
            onClick={(e) => { showCtxMenu(e); }}>
            <BsGrid3X3GapFill/>
          </DialogButton>
        </Focusable>
      </Field>
    );
  };

  return (
    <PanelSection title="Services">
      <LaunchRow name="Leaf">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd="/home/deck/Dotfiles/deck/leaf.sh"/>
        <LaunchMenu tag="start" name="Start" cmd="/home/deck/Dotfiles/deck/leaf.sh start"/>
        <LaunchMenu name="Start Global" cmd="/home/deck/Dotfiles/deck/leaf.sh start global"/>
        <LaunchMenu tag="stop" name="Stop" cmd="/home/deck/Dotfiles/deck/leaf.sh stop"/>
      </LaunchRow>
      <LaunchRow name="Auto Brightness">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user is-active auto_brightness"/>
        <LaunchMenu tag="start" name="Start" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user restart auto_brightness"/>
        <LaunchMenu tag="stop" name="Stop" cmd="XDG_RUNTIME_DIR=/run/user/1000 systemctl --user stop auto_brightness"/>
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
