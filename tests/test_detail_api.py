import importlib
import os
import tempfile
import unittest


class TestDetailApi(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)
        self.db_path = os.path.join(self.tmpdir.name, "test.db")
        self.upload_dir = os.path.join(self.tmpdir.name, "uploads")
        os.makedirs(self.upload_dir, exist_ok=True)

        os.environ["CITRUS_DB_PATH"] = self.db_path
        os.environ["UPLOAD_FOLDER"] = self.upload_dir
        os.environ["AUTH_TOKEN"] = "testtoken"

        import database
        import app as app_module

        importlib.reload(database)
        importlib.reload(app_module)
        self.app_module = app_module

        database.insert_detection("x.jpg", "ripe_orange", 80.0, 0, 12.0, "ok")
        with open(os.path.join(self.upload_dir, "x.jpg"), "wb") as f:
            f.write(b"\xff\xd8\xff\xd9")

        self.client = self.app_module.app.test_client()
        self.auth_headers = {"Authorization": "Bearer testtoken"}

    def test_detail_requires_auth(self):
        r = self.client.get("/api/v1/detection/1")
        self.assertEqual(r.status_code, 403)

    def test_detail_ok(self):
        r = self.client.get("/api/v1/detection/1", headers=self.auth_headers)
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(j["success"])
        self.assertEqual(j["data"]["id"], 1)
        self.assertEqual(j["data"]["image_ids"], ["x.jpg"])

    def test_detail_not_found(self):
        r = self.client.get("/api/v1/detection/999", headers=self.auth_headers)
        self.assertEqual(r.status_code, 404)
        j = r.get_json()
        self.assertEqual(j["code"], "DETECTION_NOT_FOUND")

    def test_image_stream_and_cache_headers(self):
        r = self.client.get("/api/v1/detection/1/image/x.jpg", headers=self.auth_headers, follow_redirects=False)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers.get("Cache-Control"), "no-store, private")
        self.assertTrue(len(r.data) > 0)
        r.close()

        r2 = self.client.get("/uploads/x.jpg", follow_redirects=False)
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.headers.get("Cache-Control"), "public, max-age=3600")
        r2.close()

    def test_image_not_found(self):
        r = self.client.get("/api/v1/detection/1/image/y.jpg", headers=self.auth_headers)
        self.assertEqual(r.status_code, 404)
        j = r.get_json()
        self.assertEqual(j["code"], "IMAGE_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
