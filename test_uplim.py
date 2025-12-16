import unittest
import subprocess
import os
import sys

# Path to the UPLim CLI
CLI_PATH = os.path.join(os.getcwd(), 'engine', 'src', 'cli.ts')
NPX_CMD = ['npx', 'tsx', CLI_PATH]

class TestUPLim(unittest.TestCase):

    def run_uplim(self, file_path):
        """Runs a UPLim file using the CLI and returns stdout."""
        result = subprocess.run(
            NPX_CMD + ['run', file_path],
            capture_output=True,
            text=True,
            cwd=os.path.join(os.getcwd(), 'engine') # Run from engine dir to find deps
        )
        return result

    def test_hello_world(self):
        """Test the basic Hello World program."""
        file_path = os.path.abspath('test_hello.upl')
        result = self.run_uplim(file_path)
        
        self.assertEqual(result.returncode, 0, f"Execution failed: {result.stderr}")
        # print(f"Stdout: {result.stdout}")
        self.assertIn("Hello UPLim", result.stdout)
        self.assertIn("30", result.stdout)

    def test_web_transpilation(self):
        """Test transpilation to JS."""
        file_path = os.path.abspath('test_web.upl')
        output_file = 'test_web_gen.js'
        
        # Compile
        # We run in 'engine' dir, so relative output path will be in 'engine'
        compile_result = subprocess.run(
             NPX_CMD + ['compile', file_path, '-o', output_file],
             capture_output=True,
             text=True,
             cwd=os.path.join(os.getcwd(), 'engine')
        )
        self.assertEqual(compile_result.returncode, 0, f"Compilation failed: {compile_result.stderr}")
        
        # Check for file existence in engine dir
        expected_output_path = os.path.join(os.getcwd(), 'engine', output_file)
        self.assertTrue(os.path.exists(expected_output_path), f"Output file not found at {expected_output_path}")
        
        # execution of generated JS
        node_result = subprocess.run(
            ['node', expected_output_path],
            capture_output=True,
            text=True
        )
        self.assertEqual(node_result.returncode, 0)
        self.assertIn("Hello Web", node_result.stdout)

if __name__ == '__main__':
    unittest.main()
