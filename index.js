const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// CONFIG - CHANGE THESE 3 THINGS
const STAFF_CHANNEL_ID = '1498629132593139712';
const ALLOWED_CHANNEL_ID = '1498550138661113926';
const YOUR_WEBSITE_URL = 'https://ignited-cloud-hosting.netlify.app';

client.once('ready', () => {
    console.log(`✅ Bot online as ${client.user.tag}`);
    client.user.setActivity('-help', { type: 'LISTENING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;
    
    const content = message.content.trim();
    
    // -help
    if (content === '-help') {
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('⚡ Ignited Cloud Bot')
            .setDescription('**Commands:**')
            .addFields(
                { name: '-register', value: '`-register email password username`', inline: false },
                { name: '-create', value: '`-create name [ram] email password`\nRAM: 2 or 4 (default 2)', inline: false },
                { name: '-servers', value: '`-servers email password`', inline: false },
                { name: '-status', value: 'Bot status', inline: true }
            );
        return message.reply({ embeds: [embed] });
    }
    
    // -status
    if (content === '-status') {
        return message.reply(`✅ Bot online! Uptime: ${Math.floor(client.uptime / 1000)}s | Ping: ${client.ws.ping}ms`);
    }
    
    // -register
    if (content.startsWith('-register')) {
        const parts = content.slice(9).trim().split(' ');
        const email = parts[0];
        const password = parts[1];
        const username = parts.slice(2).join(' ');
        
        if (!email || !password || !username) {
            return message.reply('❌ Usage: `-register email password username`');
        }
        
        await message.reply('🔄 Creating account...');
        
        try {
            const res = await axios.post(`${YOUR_WEBSITE_URL}/api/register`, { email, password, username });
            if (res.data.success) {
                await message.reply(`✅ Account created! Login at ${YOUR_WEBSITE_URL}`);
                const staff = client.channels.cache.get(STAFF_CHANNEL_ID);
                if (staff) staff.send(`📝 New user: ${username} (${email})`);
            } else {
                await message.reply(`❌ ${res.data.error}`);
            }
        } catch (err) {
            await message.reply(`❌ Registration failed. Try directly on the website.`);
        }
        return;
    }
    
    // -create
    if (content.startsWith('-create')) {
        const parts = content.slice(7).trim().split(' ');
        let serverName = parts[0];
        let ram = 2;
        let email, password;
        
        if (parts[1] === '2' || parts[1] === '4') {
            ram = parseInt(parts[1]);
            email = parts[2];
            password = parts[3];
        } else {
            email = parts[1];
            password = parts[2];
        }
        
        if (!serverName || !email || !password) {
            return message.reply('❌ Usage: `-create name [2|4] email password`');
        }
        
        await message.reply(`🔄 Creating ${serverName} with ${ram}GB...`);
        
        try {
            const res = await axios.post(`${YOUR_WEBSITE_URL}/api/create`, { email, password, serverName, ram });
            if (res.data.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Server Created!')
                    .addFields(
                        { name: 'Name', value: serverName, inline: true },
                        { name: 'RAM', value: `${ram}GB`, inline: true },
                        { name: 'IP', value: `${res.data.server.ip}:${res.data.server.port}`, inline: true }
                    );
                await message.reply({ embeds: [embed] });
                const staff = client.channels.cache.get(STAFF_CHANNEL_ID);
                if (staff) staff.send(`🎮 New server: ${serverName} (${ram}GB) by ${email}`);
            } else {
                await message.reply(`❌ ${res.data.error}`);
            }
        } catch (err) {
            await message.reply(`❌ Creation failed. Try on the website.`);
        }
        return;
    }
    
    // -servers
    if (content.startsWith('-servers')) {
        const parts = content.slice(8).trim().split(' ');
        const email = parts[0];
        const password = parts[1];
        
        if (!email || !password) {
            return message.reply('❌ Usage: `-servers email password`');
        }
        
        await message.reply('🔍 Fetching your servers...');
        
        try {
            const res = await axios.post(`${YOUR_WEBSITE_URL}/api/servers`, { email, password });
            if (res.data.success && res.data.servers.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFECA57)
                    .setTitle(`📋 Your Servers (${res.data.servers.length})`)
                    .addFields(res.data.servers.map(s => ({
                        name: s.name,
                        value: `IP: ${s.ip}:${s.port}\nRAM: ${s.ram}\nStatus: ${s.status}`,
                        inline: true
                    })));
                await message.reply({ embeds: [embed] });
            } else {
                await message.reply('📭 No servers found. Use `-create` to make one!');
            }
        } catch (err) {
            await message.reply('❌ Failed to fetch servers.');
        }
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);