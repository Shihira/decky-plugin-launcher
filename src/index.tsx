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

  const conf_dir: string = "/home/deck/Dotfiles";
  const sudo: string = `${conf_dir}/deck/deck_sudo`;
  const user_systemctl: string = "XDG_RUNTIME_DIR=/run/user/1000 systemctl --user";

  return (
    <PanelSection title="Services">
      <LaunchRow name="Leaf">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd={`systemctl is-active leaf`}/>
        <LaunchMenu tag="start" name="Start" cmd={`sed -i 's/FINAL.*/FINAL,Direct/g' ${conf_dir}/leaf/leaf.conf; ${sudo} systemctl restart leaf`}/>
        <LaunchMenu name="Start Global" cmd={`sed -i 's/FINAL.*/FINAL,Socks_Proxy/g' ${conf_dir}/leaf/leaf.conf; ${sudo} systemctl restart leaf`}/>
        <LaunchMenu tag="stop" name="Stop" cmd={`${sudo} systemctl stop leaf`}/>
      </LaunchRow>
      <LaunchRow name="Auto Brightness">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd={`${user_systemctl} is-active auto_brightness`}/>
        <LaunchMenu tag="start" name="Start" cmd={`${user_systemctl} restart auto_brightness`}/>
        <LaunchMenu tag="stop" name="Stop" cmd={`${user_systemctl} stop auto_brightness`}/>
      </LaunchRow>
      <LaunchRow name="Synergy">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd={`${user_systemctl} is-active synergy`}/>
        <LaunchMenu tag="start" name="Start" cmd={`${user_systemctl} restart synergy`}/>
        <LaunchMenu tag="stop" name="Stop" cmd={`${user_systemctl} stop synergy`}/>
      </LaunchRow>
      <LaunchRow name="Ethernet over USB">
        <LaunchMenu tag="eq" eq="usb0" name="Status" cmd={`ip route | grep -o usb0`}/>
        <LaunchMenu tag="start" name="Start" cmd={`${sudo} ${conf_dir}/deck/usb-ether.sh start -n -R`}/>
        <LaunchMenu tag="stop" name="Stop" cmd={`${sudo} ${conf_dir}/deck/usb-ether.sh stop`}/>
        <LaunchMenu name="Restart networkd" cmd={`${sudo} systemctl restart systemd-networkd`}/>
      </LaunchRow>
      <LaunchRow name="Samba">
        <LaunchMenu tag="eq" eq="active" name="Status" cmd={`systemctl is-active smb`}/>
        <LaunchMenu tag="start" name="Start" cmd={`${sudo} systemctl restart smb`}/>
        <LaunchMenu tag="stop" name="Stop" cmd={`${sudo} systemctl stop smb`}/>
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
