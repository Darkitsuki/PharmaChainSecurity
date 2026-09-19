import 'package:flutter/material.dart';

void main() {
  runApp(const PharmaSecureApp());
}

class PharmaSecureApp extends StatelessWidget {
  const PharmaSecureApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PharmaSecure Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
        useMaterial3: true,
      ),
      home: const FoundationHomeScreen(),
    );
  }
}

class FoundationHomeScreen extends StatelessWidget {
  const FoundationHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PharmaSecure Mobile V1.0'),
        backgroundColor: const Color(0xFF0F766E),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.local_pharmacy, size: 64, color: Color(0xFF0F766E)),
              SizedBox(height: 16),
              Text(
                'PharmaSecure Mobile Foundation',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),
              Text(
                'Foundation Architecture Ready\nCommunicates with Backend API via HTTPS only',
                style: TextStyle(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
