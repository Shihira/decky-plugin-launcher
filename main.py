import os
import subprocess
import decky_plugin

class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def add(self, left, right):
        return left + right

    async def launch(self, cmd):
        decky_plugin.logger.info(f"Running {cmd}")
        p = subprocess.run(["/usr/bin/bash", "-c", cmd], stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stderr = p.stderr.decode('utf-8', errors="ignore")
        stdout = p.stdout.decode('utf-8', errors="ignore")
        decky_plugin.logger.info(f"stdout: {stdout}\nstderr: {stderr}\nretcode: {p.returncode}")
        return { "stdout": stdout, "stderr": stderr, "retcode": p.returncode }

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello World!")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye World!")
        pass

