import unittest
import subprocess
import os
import sys

# Path to the UPLim CLI
CLI_PATH = os.path.join(os.getcwd(), 'src', 'cli.ts')
NPX_CMD = ['npx', 'tsx', CLI_PATH]

class TestUPLim(unittest.TestCase):

    def run_uplim(self, file_path):
        """Runs a UPLim file using the CLI and returns stdout."""
        result = subprocess.run(
            NPX_CMD + ['run', file_path],
            capture_output=True,
            text=True,
            cwd=os.getcwd() # Run from root
        )
        return result

    def test_hello_world(self):
        """Test the basic Hello World program."""
        file_path = os.path.abspath('examples/hello_world.upl') # Assuming we move it here or created it
        if not os.path.exists(file_path): # Fallback if I haven't moved it yet, though I should have
             file_path = os.path.abspath('test_hello.upl')
        
        result = self.run_uplim(file_path)
        
        self.assertEqual(result.returncode, 0, f"Execution failed: {result.stderr}")
        # print(f"Stdout: {result.stdout}")
        self.assertIn("Hello UPLim", result.stdout)
        self.assertIn("30", result.stdout)

    def test_web_transpilation(self):
        """Test transpilation to JS."""
        file_path = os.path.abspath('examples/test_web.upl')
        output_file = 'test_web_gen.js'
        
        # Compile
        # We run in root, so relative output path will be in root
        compile_result = subprocess.run(
             NPX_CMD + ['compile', file_path, '-o', output_file],
             capture_output=True,
             text=True,
             cwd=os.getcwd()
        )
        self.assertEqual(compile_result.returncode, 0, f"Compilation failed: {compile_result.stderr}")
        
        # Check for file existence in engine dir
        expected_output_path = os.path.join(os.getcwd(), output_file)
        self.assertTrue(os.path.exists(expected_output_path), f"Output file not found at {expected_output_path}")
        
        # execution of generated JS
        node_result = subprocess.run(
            ['node', expected_output_path],
            capture_output=True,
            text=True
        )
        self.assertEqual(node_result.returncode, 0)
        self.assertIn("Hello Web", node_result.stdout)

    def test_v02_features(self):
        """Test v0.2 features: Destructuring, Pipeline, Ranges, Comprehensions."""
        file_path = os.path.abspath('examples/test_v02.upl')
        # Ensure file exists (I created it in previous step via echo)
        if True: # Always overwrite to ensure content consistency
             with open(file_path, 'w') as f:
                 f.write("""
let list = [1, 2, 3]
say list
let sq = [ x * x | x in list ]
say sq
let r = 1..5
say r
func addOne(x) { return x + 1 }
let res_v2 = 10 |> addOne
say res_v2
let { a, b } = { a: 100, b: 200 }
say a
say b
                 """)
        
        result = self.run_uplim(file_path)
        self.assertEqual(result.returncode, 0, f"Execution failed: {result.stderr}")
        
        # Verify Output
        # [1, 2, 3] -> prints [1, 2, 3]
        self.assertIn("[ 1, 2, 3 ]", result.stdout)
        # [1, 4, 9] -> prints [1, 4, 9]
        self.assertIn("[ 1, 4, 9 ]", result.stdout)
        # 1..5 -> [1, 2, 3, 4, 5]
        self.assertIn("[ 1, 2, 3, 4, 5 ]", result.stdout)
        # 10 |> addOne -> 11
        self.assertIn("11", result.stdout)
        # Destructuring a, b -> 100, 200
        self.assertIn("100", result.stdout)
        self.assertIn("200", result.stdout)

    def test_v02_comprehensive(self):
        """Extended tests for v0.2: Nested comprehensions, Chained pipes, Destructuring edge cases."""
        file_path = os.path.abspath('examples/test_v02_extended.upl')
        with open(file_path, 'w') as f:
            f.write("""
func add(x) { return x + 1 }
func double(x) { return x * 2 }

# Chained Pipeline
let res = 5 |> add |> double
say res

# Nested Comprehension (List of Lists)
let matrix = [[1, 2], [3, 4]]
let nested = [ [ x * 2 | x in row ] | row in matrix ]
say nested

# Destructuring Undefined
let { x, y } = { x: 1 }
say x
# y should be undefined (or handle gracefully depending on implementation)
say y
            """)
        
        result = self.run_uplim(file_path)
        self.assertEqual(result.returncode, 0, f"Execution failed: {result.stderr}")
        
        # 5 + 1 = 6 * 2 = 12
        self.assertIn("12", result.stdout)
        
        # Nested result: [[2, 4], [6, 8]]
        self.assertIn("[ [ 2, 4 ], [ 6, 8 ] ]", result.stdout)
        
        # Destructuring
        self.assertIn("1", result.stdout)
        self.assertIn("undefined", result.stdout)

    def test_error_handling(self):
        """Test runtime errors for invalid operations."""
        file_path = os.path.abspath('examples/test_errors.upl')
        with open(file_path, 'w') as f:
             f.write("""
let x = 10
let res_err = 10 |> x  # Error: x is not a function
             """)
        
        result = self.run_uplim(file_path)
        # Should fail with error message in stderr
        self.assertNotEqual(result.returncode, 0, "Should have failed with non-zero exit code")
        self.assertIn("'x' is not a function", result.stderr)

if __name__ == '__main__':
    unittest.main()
