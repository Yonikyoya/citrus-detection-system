import unittest

from maturity import maturity_from_rgb


class TestMaturityFromRgb(unittest.TestCase):
    def assertWithin(self, value, expected, tol):
        self.assertTrue(abs(value - expected) <= tol, f"value={value}, expected={expected}±{tol}")

    def test_green_is_unripe(self):
        r = maturity_from_rgb(0, 255, 0)
        self.assertWithin(r.maturity, 40.0, 2.0)

    def test_yellow_is_mid(self):
        r = maturity_from_rgb(255, 255, 0)
        self.assertWithin(r.maturity, 70.0, 2.0)

    def test_orange_is_ripe(self):
        r = maturity_from_rgb(255, 165, 0)
        self.assertWithin(r.maturity, 90.0, 2.0)

    def test_monotonicity_green_to_orange(self):
        a = maturity_from_rgb(0, 255, 0).maturity
        b = maturity_from_rgb(255, 255, 0).maturity
        c = maturity_from_rgb(255, 165, 0).maturity
        self.assertTrue(a < b < c)


if __name__ == "__main__":
    unittest.main()

