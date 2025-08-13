#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'web', 'olt_system.db');
console.log('🔐 Configurando usuario del sistema...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
        process.exit(1);
    }
});

// Configurar el nuevo usuario "aser" con contraseña "aser"
const nuevoUsuario = 'aser';
const nuevaContrasena = 'aser';

// Generar hash de la contraseña
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(nuevaContrasena, saltRounds);

// Primero verificar si existe el usuario "alito" y renombrarlo
db.get('SELECT id FROM usuarios WHERE username = ?', ['alito'], (err, row) => {
    if (err) {
        console.error('❌ Error al buscar usuario:', err.message);
        db.close();
        return;
    }

    if (row) {
        // Actualizar el usuario existente "alito" a "aser"
        db.run(
            'UPDATE usuarios SET username = ?, password_hash = ? WHERE username = ?',
            [nuevoUsuario, hashedPassword, 'alito'],
            function(err) {
                if (err) {
                    console.error('❌ Error al actualizar usuario:', err.message);
                } else {
                    console.log('✅ Usuario actualizado correctamente');
                }
                
                // Verificar que no existan otros usuarios "aser"
                db.run(
                    'DELETE FROM usuarios WHERE username = ? AND id != ?',
                    [nuevoUsuario, row.id],
                    function(err) {
                        if (err) {
                            console.error('❌ Error al limpiar duplicados:', err.message);
                        }
                        db.close();
                    }
                );
            }
        );
    } else {
        // Si no existe "alito", verificar si existe "aser"
        db.get('SELECT id FROM usuarios WHERE username = ?', [nuevoUsuario], (err, aserRow) => {
            if (err) {
                console.error('❌ Error al buscar usuario aser:', err.message);
                db.close();
                return;
            }

            if (aserRow) {
                // Actualizar contraseña del usuario "aser" existente
                db.run(
                    'UPDATE usuarios SET password_hash = ? WHERE username = ?',
                    [hashedPassword, nuevoUsuario],
                    function(err) {
                        if (err) {
                            console.error('❌ Error al actualizar contraseña:', err.message);
                        } else {
                            console.log('✅ Contraseña actualizada correctamente');
                        }
                        db.close();
                    }
                );
            } else {
                // Crear nuevo usuario "aser"
                db.run(
                    'INSERT INTO usuarios (username, password_hash, created_at) VALUES (?, ?, datetime("now"))',
                    [nuevoUsuario, hashedPassword],
                    function(err) {
                        if (err) {
                            console.error('❌ Error al crear usuario:', err.message);
                        } else {
                            console.log('✅ Usuario creado correctamente');
                        }
                        db.close();
                    }
                );
            }
        });
    }
});
