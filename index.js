const { Client, GatewayIntentBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const admin = require('firebase-admin');

// ============================================
// FIREBASE ADMIN – FIXED for RS256 error
// ============================================
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing!');
    process.exit(1);
}

let serviceAccount;
try {
    // Parse the JSON as-is first
    let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    serviceAccount = JSON.parse(rawJson);
    
    // Fix: Replace literal \n with actual newlines in private_key
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    console.log('✅ Firebase service account loaded');
    
    // DIAGNOSTIC - Check the private key format
    console.log('=== DIAGNOSTIC START ===');
    console.log('Private key first 50 chars:', serviceAccount.private_key.substring(0, 50));
    console.log('Private key includes \\n?', serviceAccount.private_key.includes('\\n'));
    console.log('Private key includes actual newlines?', serviceAccount.private_key.includes('\n'));
    console.log('=== DIAGNOSTIC END ===');
    
} catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
    process.exit(1);
}

// Initialize with the fixed credentials
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

console.log('✅ Firebase Admin SDK initialized successfully');

// ... the rest of your bot code (commands, modals, etc.)

// ============================================
// DISCORD BOT SETUP
// ============================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const STAFF_CHANNEL_ID = '1498629132593139712';
const ALLOWED_CHANNEL_ID = '1498550138661113926';

// ============================================
// SLASH COMMANDS
// ============================================
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const commands = [
        { name: 'register', description: 'Create a new Ignited Cloud account' },
        { name: 'create', description: 'Create a new Minecraft server' },
        { name: 'servers', description: 'List all your servers' },
        { name: 'server', description: 'Manage a server (start/stop/restart/delete)' },
        { name: 'help', description: 'Show all commands' },
        { name: 'status', description: 'Check bot status' }
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered');
    } catch (err) {
        console.error('Failed to register commands:', err);
    }
});

// ============================================
// COMMAND HANDLER
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // /register – opens modal
    if (commandName === 'register') {
        const modal = new ModalBuilder()
            .setCustomId('registerModal')
            .setTitle('📝 Ignited Cloud Registration');

        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Email')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Password (min 6 chars)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const usernameInput = new TextInputBuilder()
            .setCustomId('username')
            .setLabel('Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(passwordInput),
            new ActionRowBuilder().addComponents(usernameInput)
        );
        await interaction.showModal(modal);
        return;
    }

    // /create – opens modal
    if (commandName === 'create') {
        const modal = new ModalBuilder()
            .setCustomId('createModal')
            .setTitle('🚀 Create Minecraft Server');

        const nameInput = new TextInputBuilder()
            .setCustomId('serverName')
            .setLabel('Server Name (3-20 letters/numbers)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const ramInput = new TextInputBuilder()
            .setCustomId('ram')
            .setLabel('RAM (2 or 4)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Your Email')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(ramInput),
            new ActionRowBuilder().addComponents(emailInput)
        );
        await interaction.showModal(modal);
        return;
    }

    // /servers
    if (commandName === 'servers') {
        const modal = new ModalBuilder()
            .setCustomId('serversModal')
            .setTitle('📋 Your Servers')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('email')
                        .setLabel('Your Email')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );
        await interaction.showModal(modal);
        return;
    }

    // /server action
    if (commandName === 'server') {
        const modal = new ModalBuilder()
            .setCustomId('serverActionModal')
            .setTitle('🖥️ Manage Server')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('serverId')
                        .setLabel('Server ID (from /servers)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('action')
                        .setLabel('Action (start/stop/restart/delete)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );
        await interaction.showModal(modal);
        return;
    }

    // /help
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor(0xFECA57)
            .setTitle('⚡ Ignited Cloud Commands')
            .setDescription('Use / commands to interact with the bot')
            .addFields(
                { name: '/register', value: 'Create an account (opens form)', inline: true },
                { name: '/create', value: 'Create a Minecraft server', inline: true },
                { name: '/servers', value: 'List your servers', inline: true },
                { name: '/server', value: 'Manage a server (start/stop/restart/delete)', inline: true },
                { name: '/status', value: 'Bot status', inline: true }
            );
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
                { name: 'Status', value: '🟢 Online', inline: true },
                { name: 'Uptime', value: `${hours}h ${minutes}m`, inline: true },
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }
            );
        await interaction.reply({ embeds: [embed] });
        return;
    }
});

// ============================================
// MODAL SUBMISSIONS (Firebase actions)
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    // REGISTER MODAL
    if (interaction.customId === 'registerModal') {
        const email = interaction.fields.getTextInputValue('email');
        const password = interaction.fields.getTextInputValue('password');
        const username = interaction.fields.getTextInputValue('username');

        await interaction.reply({ content: '🔄 Creating your account...', ephemeral: true });

        try {
            // Create user in Firebase Auth
            const userRecord = await auth.createUser({
                email,
                password,
                displayName: username
            });

            // Determine role (admin for special email, else user)
            const role = email === 'admin@ignited.cloud' ? 'admin' : 'user';

            // Create Firestore document
            await db.collection('users').doc(userRecord.uid).set({
                email,
                username,
                role,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Account Created!')
                .setDescription(`Welcome, **${username}**!`)
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Website', value: 'https://ignited-cloud-hosting.netlify.app', inline: true }
                );
            await interaction.editReply({ content: null, embeds: [embed] });

            const staffChannel = client.channels.cache.get(STAFF_CHANNEL_ID);
            if (staffChannel) staffChannel.send(`📝 **New User**\n👤 ${username}\n📧 ${email}`);
        } catch (error) {
            console.error('Register error:', error);
            await interaction.editReply(`❌ Registration failed: ${error.message}`);
        }
        return;
    }

    // CREATE SERVER MODAL
    if (interaction.customId === 'createModal') {
        const serverName = interaction.fields.getTextInputValue('serverName');
        const ramStr = interaction.fields.getTextInputValue('ram');
        const email = interaction.fields.getTextInputValue('email');

        const ram = parseInt(ramStr) === 4 ? 4 : 2;
        await interaction.reply({ content: `🔄 Creating **${serverName}** with ${ram}GB...`, ephemeral: true });

        try {
            // Get user by email
            const userRecord = await auth.getUserByEmail(email);
            const userId = userRecord.uid;

            // Check server limit
            const userServers = await db.collection('servers').where('ownerId', '==', userId).get();
            if (userServers.size >= 3) {
                return await interaction.editReply('❌ You already have 3 servers (max).');
            }

            // Validate server name
            if (!/^[a-zA-Z0-9]{3,20}$/.test(serverName)) {
                return await interaction.editReply('❌ Server name must be 3-20 letters/numbers.');
            }

            const ramMB = ram === 2 ? 2048 : 4096;
            const serverId = Date.now().toString();
            const port = 25565 + Math.floor(Math.random() * 100);
            const ip = `${serverName.toLowerCase().replace(/[^a-z]/g, '')}.ignited.cloud`;

            const newServer = {
                id: serverId,
                name: serverName,
                ownerId: userId,
                ownerEmail: email,
                ram: ramMB,
                ip,
                port,
                status: 'creating',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('servers').doc(serverId).set(newServer);

            // Simulate creation (set online after 5 seconds)
            setTimeout(async () => {
                await db.collection('servers').doc(serverId).update({ status: 'online' });
            }, 5000);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Server Created!')
                .addFields(
                    { name: 'Name', value: serverName, inline: true },
                    { name: 'RAM', value: `${ram}GB`, inline: true },
                    { name: 'IP', value: `${ip}:${port}`, inline: true },
                    { name: 'Manage', value: 'https://ignited-cloud-hosting.netlify.app', inline: false }
                );
            await interaction.editReply({ content: null, embeds: [embed] });

            const staffChannel = client.channels.cache.get(STAFF_CHANNEL_ID);
            if (staffChannel) staffChannel.send(`🎮 **New Server**\n📛 ${serverName}\n💾 ${ram}GB\n👤 ${email}`);
        } catch (error) {
            console.error('Create server error:', error);
            await interaction.editReply(`❌ Failed to create server: ${error.message}`);
        }
        return;
    }

    // SERVERS LIST MODAL
    if (interaction.customId === 'serversModal') {
        const email = interaction.fields.getTextInputValue('email');
        await interaction.reply({ content: '🔍 Fetching your servers...', ephemeral: true });

        try {
            const userRecord = await auth.getUserByEmail(email);
            const serversSnapshot = await db.collection('servers').where('ownerId', '==', userRecord.uid).get();

            if (serversSnapshot.empty) {
                return await interaction.editReply('📭 You have no servers. Use `/create` to make one!');
            }

            const servers = [];
            serversSnapshot.forEach(doc => {
                const data = doc.data();
                servers.push({
                    name: data.name,
                    ip: data.ip,
                    port: data.port,
                    ram: `${data.ram / 1024}GB`,
                    status: data.status || 'offline'
                });
            });

            const embed = new EmbedBuilder()
                .setColor(0xFECA57)
                .setTitle(`📋 Your Servers (${servers.length})`)
                .setDescription(servers.map(s => `**${s.name}** - ${s.ram} - ${s.ip}:${s.port} - *${s.status}*`).join('\n'));
            await interaction.editReply({ content: null, embeds: [embed] });
        } catch (error) {
            await interaction.editReply(`❌ Error: ${error.message}`);
        }
        return;
    }

    // SERVER ACTION MODAL
    if (interaction.customId === 'serverActionModal') {
        const serverId = interaction.fields.getTextInputValue('serverId');
        const action = interaction.fields.getTextInputValue('action').toLowerCase();

        await interaction.reply({ content: `🔄 ${action}ing server...`, ephemeral: true });

        try {
            const serverDoc = await db.collection('servers').doc(serverId).get();
            if (!serverDoc.exists) {
                return await interaction.editReply('❌ Server not found.');
            }

            const validActions = ['start', 'stop', 'restart', 'delete'];
            if (!validActions.includes(action)) {
                return await interaction.editReply('❌ Invalid action. Use start/stop/restart/delete.');
            }

            if (action === 'delete') {
                await db.collection('servers').doc(serverId).delete();
                await interaction.editReply('✅ Server deleted.');
            } else {
                // Update status
                await db.collection('servers').doc(serverId).update({ status: `${action}ing` });
                setTimeout(async () => {
                    const newStatus = action === 'stop' ? 'offline' : 'online';
                    await db.collection('servers').doc(serverId).update({ status: newStatus });
                }, 3000);
                await interaction.editReply(`✅ Server ${action} command sent. It will be ${action === 'stop' ? 'offline' : 'online'} shortly.`);
            }
        } catch (error) {
            await interaction.editReply(`❌ Error: ${error.message}`);
        }
        return;
    }
});

// ============================================
// PREFIX COMMANDS (fallback)
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
            .setDescription('Use slash commands (/) for best experience.\n\nPrefix commands: `-help`, `-status`');
        await message.reply({ embeds: [embed] });
    } else if (content === 'status') {
        await message.reply(`✅ Bot online! Ping: ${client.ws.ping}ms`);
    }
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('unhandledRejection', console.error);

// ============================================
// LOGIN
// ============================================
client.login(process.env.DISCORD_TOKEN);
