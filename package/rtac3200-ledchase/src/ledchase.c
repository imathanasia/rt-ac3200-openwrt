/*
 * ledchase - a small LED sweep for boards that expose only a few lamps.
 *
 * The RT-AC3200 has exactly three controllable LEDs (white:power, white:wps,
 * red:wan). Knight-Rider style sweep across them, then the original trigger
 * state is restored so the configured behaviour (power steady, WAN activity)
 * comes back.
 *
 * Built as part of the image; source only, no vendor blobs.
 */
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <signal.h>
#include <unistd.h>

#define NLED 3

static const char *names[NLED] = {
	"/sys/class/leds/white:power/brightness",
	"/sys/class/leds/white:wps/brightness",
	"/sys/class/leds/red:wan/brightness",
};

static int fd[NLED] = { -1, -1, -1 };
static const char *triggers[NLED] = {
	"/sys/class/leds/white:power/trigger",
	"/sys/class/leds/white:wps/trigger",
	"/sys/class/leds/red:wan/trigger",
};

static volatile sig_atomic_t interrupted;

static void on_signal(int sig)
{
	(void)sig;
	interrupted = 1;
}

static void msleep(long ms)
{
	struct timespec ts;
	ts.tv_sec = ms / 1000;
	ts.tv_nsec = (ms % 1000) * 1000000L;
	while (nanosleep(&ts, &ts) == -1 && errno == EINTR)
		;
}

static void set(int i, int on)
{
	char c = on ? '1' : '0';
	if (fd[i] < 0)
		return;
	lseek(fd[i], 0, SEEK_SET);
	if (write(fd[i], &c, 1) != 1)
		;
}

static void all(int on)
{
	int i;
	for (i = 0; i < NLED; i++)
		set(i, on);
}

int main(int argc, char **argv)
{
	int i, pass, step;
	long speed = 380;
	const int order[] = { 0, 1, 2, 1 };
	const int order_len = 4;

	for (i = 1; i < argc; i++) {
		if (!strcmp(argv[i], "-s") && i + 1 < argc)
			speed = atol(argv[++i]);
		else if (!strcmp(argv[i], "-h")) {
			printf("usage: %s [-s ms]\n", argv[0]);
			return 0;
		}
	}

	/* detach whatever trigger is active, or brightness writes are ignored */
	for (i = 0; i < NLED; i++) {
		int t = open(triggers[i], O_WRONLY);
		if (t >= 0) {
			if (write(t, "none", 4) != 4)
				;
			close(t);
		}
	}

	for (i = 0; i < NLED; i++) {
		fd[i] = open(names[i], O_WRONLY);
		if (fd[i] < 0) {
			fprintf(stderr, "ledchase: %s: %s\n", names[i], strerror(errno));
			return 1;
		}
	}

	signal(SIGTERM, on_signal);
	signal(SIGINT, on_signal);

	/* all on, then a short black gap */
	all(1);
	msleep(speed * 2);
	all(0);
	msleep(speed / 2);

	/* sweep 1-2-3-2, three times, slowing at the ends like the original */
	for (pass = 0; pass < 3 && !interrupted; pass++) {
		for (step = 0; step < order_len && !interrupted; step++) {
			all(0);
			set(order[step], 1);
			/* dwell a little longer at the ends, like the original */
			if (order[step] == 0 || order[step] == NLED - 1)
				msleep(speed * 3 / 2);
			else
				msleep(speed);
		}
	}

	/* leave the power lamp lit; /etc/init.d/led restart takes over below */
	set(0, 1);

	for (i = 0; i < NLED; i++)
		close(fd[i]);

	/* hand the lamps back to the configured triggers */
	if (system("/etc/init.d/led restart >/dev/null 2>&1") == -1)
		;

	return 0;
}
