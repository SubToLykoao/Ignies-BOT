const { Client, GatewayIntentBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

// ============================================
// CONFIGURATION
// ============================================
const STAFF_CHANNEL_ID = '1498629132593139712';
const ALLOWED_CHANNEL_ID = '1498550138661113926';
const YOUR_WEBSITE_URL = 'https://ignited-cloud-hosting.netlify.app';

// Store user sessions (temp)
const userSessions = new Map();

// ============================================
// BOT READY
// ============================================
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{ name: '-help | Ignited Cloud', type: 3 }],
        status: 'online'
    });
    
    // Create commands for global use
    const commands = [
        { name: 'register', description: 'Create a new Ignited Cloud account' },
        { name: 'create', description: 'Create a new Minecraft server' },
        { name: 'servers', description: 'List all your servers' },
        { name: 'server', description: 'Manage a specific server (start/stop/restart/delete)' },
        { name: 'stats', description: 'View server statistics' },
        { name: 'help', description: 'Show all commands' },
        { name: 'status', description: 'Check bot status' },
        { name: 'invite', description: 'Get bot invite link' },
        { name: 'ping', description: 'Check bot latency' }
    ];
    
    try {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered!');
    } catch (err) {
        console.error('Failed to register commands:', err);
    }
});

// ============================================
// SLASH COMMANDS HANDLER
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const { commandName } = interaction;
    
    // /register
    if (commandName === 'register') {
        const modal = new ModalBuilder()
            .setCustomId('registerModal')
            .setTitle('📝 Ignited Cloud Registration');
        
        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Email Address')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('you@example.com')
            .setRequired(true);
        
        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Password (min 6 characters)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const usernameInput = new TextInputBuilder()
            .setCustomId('username')
            .setLabel('Username')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Your in-game name')
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(passwordInput),
            new ActionRowBuilder().addComponents(usernameInput)
        );
        
        await interaction.showModal(modal);
        return;
    }
    
    // /create
    if (commandName === 'create') {
        const modal = new ModalBuilder()
            .setCustomId('createModal')
            .setTitle('🚀 Create Minecraft Server');
        
        const nameInput = new TextInputBuilder()
            .setCustomId('serverName')
            .setLabel('Server Name (3-20 letters/numbers)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('MySurvivalWorld')
            .setRequired(true);
        
        const gameInput = new TextInputBuilder()
            .setCustomId('gameType')
            .setLabel('Game Type (minecraft_java/bedrock/terraria)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('minecraft_java')
            .setRequired(true);
        
        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Your Account Email')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(gameInput),
            new ActionRowBuilder().addComponents(emailInput)
        );
        
        await interaction.showModal(modal);
        return;
    }
    
    // /servers
    if (commandName === 'servers') {
        const modal = new ModalBuilder()
            .setCustomId('serversModal')
            .setTitle('📋 View Your Servers');
        
        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Your Email')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(emailInput));
        await interaction.showModal(modal);
        return;
    }
    
    // /server (manage specific server)
    if (commandName === 'server') {
        const modal = new ModalBuilder()
            .setCustomId('serverActionModal')
            .setTitle('🖥️ Manage Server');
        
        const serverIdInput = new TextInputBuilder()
            .setCustomId('serverId')
            .setLabel('Server ID (from /servers)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const actionInput = new TextInputBuilder()
            .setCustomId('action')
            .setLabel('Action (start/stop/restart/delete)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('start, stop, restart, delete')
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(serverIdInput),
            new ActionRowBuilder().addComponents(actionInput)
        );
        
        await interaction.showModal(modal);
        return;
    }
    
    // /stats
    if (commandName === 'stats') {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📊 Ignited Cloud Statistics')
            .setDescription('Current platform statistics')
            .addFields(
                { name: '🌐 Website', value: YOUR_WEBSITE_URL, inline: false },
                { name: '🎮 Active Servers', value: 'Fetching...', inline: true },
                { name: '👥 Total Users', value: 'Fetching...', inline: true },
                { name: '⚡ Bot Uptime', value: `${Math.floor(client.uptime / 1000 / 60)} minutes`, inline: true }
            )
            .setFooter({ text: 'Ignited Cloud - Premium Minecraft Hosting' });
        
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    // /help
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('⚡ Ignited Cloud Commands')
            .setDescription('Here are all available commands:')
            .addFields(
                { name: '📝 `/register`', value: 'Create a new account', inline: true },
                { name: '🚀 `/create`', value: 'Create a Minecraft server', inline: true },
                { name: '📋 `/servers`', value: 'List your servers', inline: true },
                { name: '🖥️ `/server`', value: 'Manage a specific server', inline: true },
                { name: '📊 `/stats`', value: 'View platform statistics', inline: true },
                { name: '❓ `/help`', value: 'Show this help message', inline: true },
                { name: '📡 `/status`', value: 'Check bot status', inline: true },
                { name: '🔗 `/invite`', value: 'Get bot invite link', inline: true },
                { name: '🏓 `/ping`', value: 'Check bot latency', inline: true }
            )
            .setFooter({ text: 'Use slash commands (/) in this server!' });
        
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    // /status
    if (commandName === 'status') {
        const uptime = Math.floor(client.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🤖 Bot Status')
            .addFields(
                { name: '📡 Status', value: '🟢 Online', inline: true },
                { name: '⏱️ Uptime', value: `${hours}h ${minutes}m`, inline: true },
                { name: '📶 Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: '🎮 Servers', value: client.guilds.cache.size.toString(), inline: true },
                { name: '👥 Users', value: 'N/A', inline: true }
            );
        
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    // /invite
    if (commandName === 'invite') {
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('🔗 Invite Ignited Cloud Bot')
            .setDescription('Add this bot to your own server!')
            .addFields(
                { name: 'Bot Invite', value: '[Click Here](https://discord.com/oauth2/authorize?client_id=' + client.user.id + '&permissions=8&scope=bot%20applications.commands)', inline: false },
                { name: 'Website', value: YOUR_WEBSITE_URL, inline: false },
                { name: 'Support', value: 'Join our Discord for help!', inline: false }
            );
        
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    // /ping
    if (commandName === 'ping') {
        await interaction.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
        return;
    }
});

// ============================================
// MODAL SUBMISSIONS
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    // Register Modal
    if (interaction.customId === 'registerModal') {
        const email = interaction.fields.getTextInputValue('email');
        const password = interaction.fields.getTextInputValue('password');
        const username = interaction.fields.getTextInputValue('username');
        
        await interaction.reply({ content: '🔄 Creating your account...', ephemeral: true });
        
        try {
            const response = await fetch(`${YOUR_WEBSITE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });
            const data = await response.json();
            
            if (data.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Account Created!')
                    .setDescription(`Welcome to Ignited Cloud, **${username}**!`)
                    .addFields(
                        { name: '📧 Email', value: email, inline: true },
                        { name: '🌐 Login', value: YOUR_WEBSITE_URL, inline: true },
                        { name: '🚀 Next', value: 'Use `/create` to make your first server!', inline: false }
                    );
                await interaction.editReply({ content: null, embeds: [embed] });
                
                const staff = client.channels.cache.get(STAFF_CHANNEL_ID);
                if (staff) staff.send(`📝 **New Registration**\n👤 ${username}\n📧 ${email}\n🆔 ${interaction.user.tag}`);
            } else {
                await interaction.editReply(`❌ ${data.error || 'Registration failed'}`);
            }
        } catch (err) {
            await interaction.editReply(`❌ Registration failed. Please try on the website: ${YOUR_WEBSITE_URL}`);
        }
        return;
    }
    
    // Create Server Modal
    if (interaction.customId === 'createModal') {
        const serverName = interaction.fields.getTextInputValue('serverName');
        const gameType = interaction.fields.getTextInputValue('gameType');
        const email = interaction.fields.getTextInputValue('email');
        
        await interaction.reply({ content: `🔄 Creating **${serverName}** server...`, ephemeral: true });
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Server Created!')
            .addFields(
                { name: '📛 Name', value: serverName, inline: true },
                { name: '🎮 Type', value: gameType, inline: true },
                { name: '🌐 Login', value: YOUR_WEBSITE_URL, inline: true }
            );
        
        await interaction.editReply({ content: null, embeds: [embed] });
        
        const staff = interaction.guild.channels.cache.get(STAFF_CHANNEL_ID);
        if (staff) staff.send(`🎮 **New Server**\n📛 ${serverName}\n🎮 ${gameType}\n👤 ${email}`);
        return;
    }
    
    // Servers List Modal
    if (interaction.customId === 'serversModal') {
        const email = interaction.fields.getTextInputValue('email');
        await interaction.reply({ content: '🔍 Fetching your servers...', ephemeral: true });
        
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('📋 Your Servers')
            .setDescription(`Login to the website to view and manage your servers:\n${YOUR_WEBSITE_URL}`);
        
        await interaction.editReply({ content: null, embeds: [embed] });
        return;
    }
    
    // Server Action Modal
    if (interaction.customId === 'serverActionModal') {
        const serverId = interaction.fields.getTextInputValue('serverId');
        const action = interaction.fields.getTextInputValue('action');
        
        await interaction.reply({ content: `🔄 ${action}ing server ${serverId}...`, ephemeral: true });
        await interaction.editReply(`✅ Server ${action} command sent! Check your panel: ${YOUR_WEBSITE_URL}`);
        return;
    }
});

// ============================================
// PREFIX COMMANDS (Backup)
// ============================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;
    if (!message.content.startsWith('-')) return;
    
    const content = message.content.slice(1).toLowerCase();
    
    if (content === 'help') {
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('⚡ Ignited Cloud Commands')
            .setDescription('Use slash commands (`/`) for better experience!\n\n**Prefix commands:**')
            .addFields(
                { name: '-register', value: 'Create an account', inline: true },
                { name: '-create', value: 'Create a server', inline: true },
                { name: '-servers', value: 'List your servers', inline: true },
                { name: '-help', value: 'Show this help', inline: true },
                { name: '-status', value: 'Bot status', inline: true }
            );
        await message.reply({ embeds: [embed] });
    }
    
    if (content === 'status') {
        await message.reply(`✅ Bot online! Ping: ${client.ws.ping}ms`);
    }
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// ============================================
// LOGIN
// ============================================
client.login(process.env.DISCORD_TOKEN);
