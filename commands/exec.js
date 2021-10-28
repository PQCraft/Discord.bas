const { exec } = require("child_process");
const fs = require("fs");

module.exports.cmd = async (client, message, _args) => {
    let code = "";
    let content = message.content
        .substr(client.config.PREFIX.length + 4 /* command length */ + 1 /* new line */);
    content.split("\n")
        .forEach((line) => {
            if (line.match(/^```/)) {
                line += "";
            } else if (line.match(/```$/)) {
                code += line.replace(/```$/, "") + "\n"
            } else {
                code += line + "\n";
            }
        });

    let file_process = exec(`echo -n "$(tempfile -d /tmp -p prog_ -s .bas)"`);
    let file = "";
    console.log("0: " + file);
    exec("cat index.js", (error, data, getter) => {
        callback(data);
        file = data;
        console.log("1: " + file);
    });
    console.log("2: " + file);
    fs.writeFileSync(file, code, { encoding: "utf8" });

    let output = "";
    let executing_msg = await message.reply("executing...");
    let clibasic_process = exec(`cd tmp/ && clibasic -nrex "./${file}"`);
    let start_time = Date.now();
    clibasic_process.stdout.on("data", (data) => {
        if (data.length < 1024) {
            output += data;
        }
    });
    clibasic_process.stderr.on("data", (data) => {
        console.log("stderr: " + data)
    });
    clibasic_process.once("close", (code) => {
        let time = `took \`${(Date.now() - start_time) / 1000}\` seconds`
        let code_str = `exited with code \`${code}\``;
        if (!output || output.trim() === "") {
            executing_msg.edit(`Output is empty\n${time}\n${code_str}`);
        } else {
            executing_msg.edit(`output:\`\`\`sh\n${output}\n\`\`\`\n${time}\n${code_str}`);
        }
    });
    setTimeout(() => {
        if (clibasic_process.exitCode === null) {
            clibasic_process.kill(9);
            message.reply(`Process has been killed after running for longer than the maximum ${client.config.maxExecTime ? client.config.maxExecTime : 10000}ms!`)
        }
        fs.unlinkSync(file);
    }, client.config.maxExecTime ? client.config.maxExecTime : 10000);
}

module.exports.help = {
    name: "exec",
    description: "runs clibasic with following code",
    usage: "%PREFIX%exec\n\\`\\`\\`basic\nprint \"Hello, world!\"\n\\`\\`\\`"
}
